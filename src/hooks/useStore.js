import { useState, useEffect, useRef } from 'react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, setDoc,
  onSnapshot, query, where, writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_SHOPS } from '../data/defaultShops';

function today() {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_OPTIONS = {
  sugar: ['全糖', '少糖', '半糖', '微糖', '無糖'],
  ice: ['正常冰', '少冰', '微冰', '去冰', '熱'],
  toppings: ['珍珠', '椰果', '布丁', '仙草', '芋圓'],
};

export function useStore() {
  const [shops, setShops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [histSessions, setHistSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [announcementText, setAnnouncementText] = useState('');

  // 追蹤各 listener 是否已收到第一次資料
  const seen = useRef({ shops: false, active: false, hist: false, orders: false });

  function tick(key) {
    seen.current[key] = true;
    if (Object.values(seen.current).every(Boolean)) setLoading(false);
  }

  useEffect(() => {
    const unsubs = [];

    // ── 店家 ─────────────────────────────────────────────────
    const seeding = { done: false };
    unsubs.push(onSnapshot(collection(db, 'shops'), async (snap) => {
      if (snap.empty && !seeding.done) {
        seeding.done = true;
        const batch = writeBatch(db);
        DEFAULT_SHOPS.forEach((s) => batch.set(doc(db, 'shops', s.id), s));
        await batch.commit();
        // listener 會自動再觸發一次拿到資料
      } else if (!snap.empty) {
        setShops(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
        tick('shops');
      }
    }));

    // ── 進行中的團購單 ────────────────────────────────────────
    unsubs.push(onSnapshot(
      query(collection(db, 'sessions'), where('status', '==', 'open')),
      (snap) => {
        setActiveSessions(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
        tick('active');
      },
    ));

    // ── 歷史團購單 ────────────────────────────────────────────
    unsubs.push(onSnapshot(
      query(collection(db, 'sessions'), where('status', '==', 'closed')),
      (snap) => {
        setHistSessions(
          snap.docs.map((d) => ({ ...d.data(), id: d.id }))
            .sort((a, b) => b.date.localeCompare(a.date)),
        );
        tick('hist');
      },
    ));

    // ── 訂單 ─────────────────────────────────────────────────
    unsubs.push(onSnapshot(collection(db, 'orders'), (snap) => {
      setOrders(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      tick('orders');
    }));

    // ── 系統公告（非阻塞載入）───────────────────────────────────
    unsubs.push(onSnapshot(doc(db, 'config', 'announcement'), (snap) => {
      setAnnouncementText(snap.exists() ? (snap.data().text || '') : '');
    }));

    return () => unsubs.forEach((u) => u());
  }, []);

  // ── 計算值 ──────────────────────────────────────────────────
  const totalActiveOrdersCount = activeSessions.reduce(
    (sum, s) => sum + orders.filter((o) => o.sessionId === s.id).length,
    0,
  );

  const pastSessions = histSessions;

  function getActiveSessionOrders(sessionId) {
    return orders.filter((o) => o.sessionId === sessionId);
  }

  function getSessionOrders(sessionId) {
    return orders.filter((o) => o.sessionId === sessionId);
  }

  // ── 團購單操作 ──────────────────────────────────────────────
  async function startSession(shopId, durationMinutes = 30) {
    const shop = shops.find((s) => s.id === shopId);
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    const ref = await addDoc(collection(db, 'sessions'), {
      shopId,
      shopName: shop?.name || '',
      date: today(),
      status: 'open',
      durationMinutes,
      createdAt: new Date().toISOString(),
      expiresAt,
    });
    return ref.id;
  }

  async function closeSession(sessionId) {
    const hasOrders = orders.some((o) => o.sessionId === sessionId);
    if (hasOrders) {
      await updateDoc(doc(db, 'sessions', sessionId), { status: 'closed' });
    } else {
      await deleteDoc(doc(db, 'sessions', sessionId));
    }
  }

  async function resetSession(sessionId) {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'sessions', sessionId));
    orders.filter((o) => o.sessionId === sessionId)
      .forEach((o) => batch.delete(doc(db, 'orders', o.id)));
    await batch.commit();
  }

  async function continueSession(sessionId) {
    const session = activeSessions.find((s) => s.id === sessionId);
    const expiresAt = new Date(
      Date.now() + (session?.durationMinutes || 30) * 60 * 1000,
    ).toISOString();
    await updateDoc(doc(db, 'sessions', sessionId), { date: today(), expiresAt });
  }

  async function extendSession(sessionId, extraMinutes = 15) {
    const session = activeSessions.find((s) => s.id === sessionId);
    const base = session?.expiresAt && new Date(session.expiresAt) > new Date()
      ? new Date(session.expiresAt)
      : new Date();
    const expiresAt = new Date(base.getTime() + extraMinutes * 60 * 1000).toISOString();
    await updateDoc(doc(db, 'sessions', sessionId), { expiresAt });
  }

  // ── 訂單操作 ────────────────────────────────────────────────
  async function addOrder(orderData, sessionId) {
    const sessionOrders = orders.filter((o) => o.sessionId === sessionId);
    const serialNo = String(sessionOrders.length + 1).padStart(3, '0');
    await addDoc(collection(db, 'orders'), {
      ...orderData,
      serialNo,
      sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  async function removeOrder(orderId) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const batch = writeBatch(db);
    batch.delete(doc(db, 'orders', orderId));
    // 重新編號同 session 剩餘訂單
    orders
      .filter((o) => o.sessionId === order.sessionId && o.id !== orderId)
      .sort((a, b) => a.serialNo.localeCompare(b.serialNo))
      .forEach((o, i) => {
        batch.update(doc(db, 'orders', o.id), { serialNo: String(i + 1).padStart(3, '0') });
      });
    await batch.commit();
  }

  async function updateOrder(orderId, data) {
    await updateDoc(doc(db, 'orders', orderId), data);
  }

  async function setAnnouncement(text) {
    await setDoc(doc(db, 'config', 'announcement'), { text });
  }

  async function removeHistorySession(sessionId) {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'sessions', sessionId));
    orders.filter((o) => o.sessionId === sessionId)
      .forEach((o) => batch.delete(doc(db, 'orders', o.id)));
    await batch.commit();
  }

  // ── 店家/菜單操作 ────────────────────────────────────────────
  async function addShop(shop) {
    const id = `shop-${Date.now()}`;
    await setDoc(doc(db, 'shops', id), { ...shop, id, menu: [], options: DEFAULT_OPTIONS });
    return id;
  }

  async function removeShop(shopId) {
    await deleteDoc(doc(db, 'shops', shopId));
  }

  async function addMenuItem(shopId, item) {
    const shop = shops.find((s) => s.id === shopId);
    if (!shop) return;
    const id = `item-${Date.now()}`;
    await updateDoc(doc(db, 'shops', shopId), { menu: [...shop.menu, { ...item, id }] });
  }

  async function removeMenuItem(shopId, itemId) {
    const shop = shops.find((s) => s.id === shopId);
    if (!shop) return;
    await updateDoc(doc(db, 'shops', shopId), { menu: shop.menu.filter((m) => m.id !== itemId) });
  }

  async function importMenuItems(shopId, items, mode = 'append') {
    const shop = shops.find((s) => s.id === shopId);
    if (!shop) return;
    const newItems = items.map((item, i) => ({ ...item, id: `import-${Date.now()}-${i}` }));
    const newMenu = mode === 'replace' ? newItems : [...shop.menu, ...newItems];
    await updateDoc(doc(db, 'shops', shopId), { menu: newMenu });
  }

  async function resetShops() {
    const batch = writeBatch(db);
    DEFAULT_SHOPS.forEach((s) => batch.set(doc(db, 'shops', s.id), s));
    shops.filter((s) => !DEFAULT_SHOPS.find((d) => d.id === s.id))
      .forEach((s) => batch.delete(doc(db, 'shops', s.id)));
    await batch.commit();
  }

  return {
    shops,
    orders,
    activeSessions,
    sessions: histSessions,
    totalActiveOrdersCount,
    pastSessions,
    loading,
    getActiveSessionOrders,
    getSessionOrders,
    startSession,
    closeSession,
    resetSession,
    continueSession,
    extendSession,
    addOrder,
    removeOrder,
    updateOrder,
    removeHistorySession,
    announcement: announcementText,
    setAnnouncement,
    addShop,
    removeShop,
    addMenuItem,
    removeMenuItem,
    importMenuItems,
    resetShops,
  };
}
