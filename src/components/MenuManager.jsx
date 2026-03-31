import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { AnimatePresence, motion } from 'framer-motion';
import { parseNidinMenu, fuzzyScore, getLocation, formatDistance, calcDistance } from '../lib/nidinHelpers';

// ── 你訂匯入 Modal ──────────────────────────────────────────────────

function NidinImportModal({ onImport, onClose }) {
  const [step, setStep] = useState('search');    // search | stores | preview
  const [query, setQuery] = useState('');
  const [allBrands, setAllBrands] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const locationRef = useRef(null);

  // 掛載時同時抓品牌清單 + 取得定位（不阻塞）
  useEffect(() => {
    getLocation().then((loc) => { locationRef.current = loc; }).catch(() => {});
    fetch('/api/nidin?path=brands')
      .then((r) => r.json())
      .then((data) => {
        const DRINK_TAGS = ['飲料', '手搖', '茶飲', '咖啡', '果汁', '奶茶', '飲品', '冰品'];
        const seen = new Set();
        const deduped = (data.brands || [])
          .filter((b) => {
            const tags = (b.meal_tag_info || []).map((t) => t.name).join('');
            return DRINK_TAGS.some((t) => tags.includes(t) || (b.name || '').includes(t));
          })
          .filter((b) => {
            const key = b.name;
            if (seen.has(key)) return false;
            seen.add(key); return true;
          });
        setAllBrands(deduped);
      })
      .catch(() => {});
  }, []);

  // 即時過濾品牌
  const suggestions = query.trim().length === 0 ? [] : allBrands
    .map((b) => ({ ...b, _score: Math.max(fuzzyScore(b.name, query.trim()), fuzzyScore(b.name_short || '', query.trim())) }))
    .filter((b) => b._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 8);

  async function selectBrand(brand) {
    setSelectedBrand(brand); setLoading(true); setError(''); setStep('stores');
    try {
      let loc = locationRef.current;
      if (!loc) {
        try { loc = await getLocation(); locationRef.current = loc; } catch { /* 無定位，回退全台列表 */ }
      }

      let stores = [];

      if (loc) {
        if (brand.brand_code) {
          const res = await fetch(
            `/api/nidin?path=store/listByPositionNew&latitude=${loc.lat}&longitude=${loc.lng}&page=1&count=50&src_type=3`,
            { headers: { 'x-nidin-brand': brand.brand_code } }
          );
          const data = await res.json();
          stores = data.stores || [];
        }

        if (stores.length === 0) {
          const res = await fetch(
            `/api/nidin?path=store/listByPositionNew&latitude=${loc.lat}&longitude=${loc.lng}&page=1&count=50&src_type=3`
          );
          const data = await res.json();
          const brandName = brand.name?.toLowerCase() || '';
          stores = (data.stores || []).filter((s) =>
            s.brand_name?.toLowerCase().includes(brandName) ||
            s.name?.toLowerCase().includes(brandName)
          );
        }

        if (stores.length === 0 && brand.id) {
          const res = await fetch(`/api/nidin?path=brand/${brand.id}/stores`);
          const data = await res.json();
          stores = (data.stores || [])
            .map((s) => {
              const sLat = parseFloat(s.lat ?? s.latitude ?? s.location?.lat ?? '');
              const sLng = parseFloat(s.lng ?? s.longitude ?? s.lon ?? s.location?.lng ?? '');
              const dist = !isNaN(sLat) && !isNaN(sLng) ? calcDistance(loc.lat, loc.lng, sLat, sLng) : null;
              return { ...s, distance: dist };
            })
            .filter((s) => s.distance !== null && s.distance <= 30000)
            .sort((a, b) => a.distance - b.distance);
        }
      } else {
        if (brand.id) {
          const res = await fetch(`/api/nidin?path=brand/${brand.id}/stores`);
          const data = await res.json();
          stores = data.stores || [];
        }
      }

      setStores(stores);
    } catch { setError('無法取得分店列表'); }
    finally { setLoading(false); }
  }

  async function selectStore(store) {
    setSelectedStore(store); setLoading(true); setError('');
    try {
      const res = await fetch(`/api/nidin?path=store/${store.id}/onShelfMenu`);
      const data = await res.json();
      setMenuItems(parseNidinMenu(data));
      setStep('preview');
    } catch { setError('無法取得菜單'); }
    finally { setLoading(false); }
  }

  function goBack() {
    const map = { stores: 'search', preview: 'stores' };
    setStep(map[step] || 'search');
  }

  const stepTitle = { search: '從你訂匯入', stores: selectedBrand?.name, preview: '確認匯入' };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="glass-card rounded-t-3xl sm:rounded-3xl w-full max-w-lg flex flex-col"
        style={{ maxHeight: '82vh' }}
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {step !== 'search' && (
                <button onClick={goBack} className="text-white/40 hover:text-white/60 text-xl pr-1">←</button>
              )}
              <h3 className="font-bold text-lg">{stepTitle[step]}</h3>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white/60 text-2xl leading-none">×</button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 pb-4">
          {step === 'search' && (
            <div className="space-y-2 pt-1">
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="輸入店家名稱（例：50嵐、迷客夏）"
                className="w-full border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                autoFocus
              />
              {query.trim() && (
                <div className="space-y-1">
                  {allBrands.length === 0 && <p className="text-center text-white/40 py-4 text-sm">品牌清單載入中...</p>}
                  {allBrands.length > 0 && suggestions.length === 0 && (
                    <p className="text-center text-white/40 py-4 text-sm">找不到「{query}」，請換個關鍵字</p>
                  )}
                  {suggestions.map((b) => (
                    <button key={b.brand_code || b.id} onClick={() => selectBrand(b)}
                      className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-orange-500/100/10 transition-colors"
                    >
                      {b.image
                        ? <img src={b.image} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />
                        : <div className="w-10 h-10 rounded-lg bg-orange-500/15 flex items-center justify-center text-lg shrink-0">🍱</div>
                      }
                      <div className="font-medium text-white">{b.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'stores' && (
            <div className="space-y-1">
              {loading ? (
                <p className="text-center text-white/40 py-6">載入中...</p>
              ) : stores.length === 0 ? (
                <p className="text-center text-white/40 py-6 text-sm">此品牌目前無可選分店</p>
              ) : stores.map((s) => (
                <button key={s.id} onClick={() => selectStore(s)}
                  className="w-full text-left px-3 py-3 rounded-xl hover:bg-orange-500/100/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-white">{s.name}</div>
                    {s.distance != null && (
                      <span className="text-xs text-orange-500 font-medium shrink-0 ml-2">{formatDistance(s.distance)}</span>
                    )}
                  </div>
                  <div className="text-xs text-white/40">{s.address}</div>
                </button>
              ))}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-3">
              {loading ? <p className="text-center text-white/40 py-6">載入菜單中...</p> : (
                <>
                  <div className="bg-orange-500/10 rounded-xl px-4 py-3">
                    <p className="font-semibold text-orange-300">{selectedBrand?.name} {selectedStore?.name}</p>
                    <p className="text-sm text-orange-400 mt-0.5">共 {menuItems.length} 個品項</p>
                    {selectedStore?.tel && <p className="text-xs text-orange-500 mt-0.5">📞 {selectedStore.tel}</p>}
                  </div>
                  <div className="space-y-1 max-h-52 overflow-y-auto">
                    {menuItems.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm text-white/60 py-1.5 border-b last:border-0">
                        <span>{item.name}</span>
                        <span className="text-white/40">NT${item.price}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {error && <p className="text-red-500 text-sm text-center mt-3">{error}</p>}
        </div>

        {/* Footer */}
        {step === 'preview' && !loading && menuItems.length > 0 && (
          <div className="px-6 pb-6 pt-2 shrink-0 border-t">
            <motion.button
              onClick={() => onImport({ shopName: `${selectedBrand.name} ${selectedStore.name}`, phone: selectedStore.tel || '', items: menuItems })}
              className="w-full bg-orange-500/100 text-white py-3.5 rounded-2xl font-semibold text-base hover:bg-orange-600"
              whileTap={{ scale: 0.97 }}
            >新增店家並匯入菜單</motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── 主元件 ──────────────────────────────────────────────────────────
export default function MenuManager({ shops, onAddShop, onUpdateShop, onRemoveShop, onAddMenuItem, onRemoveMenuItem, onResetShops, onImportMenuItems, announcement, onSetAnnouncement, siteTitle, onSetSiteTitle, leaderCode, onSetLeaderCode }) {
  const [selectedShopId, setSelectedShopId] = useState(shops[0]?.id || '');
  const [announcementInput, setAnnouncementInput] = useState(announcement || '');
  const [leaderCodeInput, setLeaderCodeInput] = useState(leaderCode || '1212');
  const [siteTitleInput, setSiteTitleInput] = useState(siteTitle || '');
  const [newShopName, setNewShopName] = useState('');
  const [showAddShop, setShowAddShop] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', sizeL: '' });
  const [showAddItem, setShowAddItem] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importError, setImportError] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [showNidinModal, setShowNidinModal] = useState(false);
  const fileInputRef = useRef(null);

  async function handleNidinImport({ shopName, phone, items }) {
    const newId = await onAddShop({ name: shopName, phone });
    await onImportMenuItems(newId, items, 'replace');
    setSelectedShopId(newId);
    setShowNidinModal(false);
  }

  const shop = shops.find((s) => s.id === selectedShopId);

  // 切換店家時同步電話欄
  useEffect(() => { setPhoneInput(shop?.phone || ''); }, [shop]);
  function handleSelectShop(id) {
    setSelectedShopId(id);
    setPhoneInput(shops.find((s) => s.id === id)?.phone || '');
  }

  function handleAddShop() {
    if (!newShopName.trim()) return;
    const newId = onAddShop({ name: newShopName.trim() });
    setSelectedShopId(newId);
    setNewShopName('');
    setShowAddShop(false);
  }

  function handleAddItem() {
    if (!newItem.name.trim() || !newItem.price) return;
    const price = parseInt(newItem.price, 10);
    const sizes = [{ label: 'M', add: 0 }];
    if (newItem.sizeL) sizes.push({ label: 'L', add: parseInt(newItem.sizeL, 10) || 0 });
    onAddMenuItem(selectedShopId, { name: newItem.name.trim(), price, sizes });
    setNewItem({ name: '', price: '', sizeL: '' });
    setShowAddItem(false);
  }

  // 下載 Excel 範本
  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      ['品項名稱', 'M價格', 'L加價（留空表示無大杯）'],
      ['珍珠奶茶', 50, 10],
      ['鮮奶茶', 55, 10],
      ['四季春茶', 35, 5],
      ['檸檬綠茶', 50, ''],
    ]);
    ws['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 22 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '菜單');
    XLSX.writeFile(wb, '飲料菜單範本.xlsx');
  }

  // 讀取 Excel 檔案
  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImportError('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // 跳過標題列
        const dataRows = rows.slice(1).filter((r) => r[0]?.toString().trim());
        if (dataRows.length === 0) {
          setImportError('找不到資料，請確認格式是否正確（第一列為標題，第二列起為品項）');
          return;
        }

        const items = dataRows.map((r) => {
          const name = r[0]?.toString().trim();
          const price = parseInt(r[1], 10) || 0;
          const lAdd = r[2] !== '' ? parseInt(r[2], 10) : null;
          const sizes = [{ label: 'M', add: 0 }];
          if (lAdd !== null && !isNaN(lAdd)) sizes.push({ label: 'L', add: lAdd });
          return { name, price, sizes };
        }).filter((i) => i.name && i.price > 0);

        if (items.length === 0) {
          setImportError('沒有有效品項，請確認品項名稱和價格欄位');
          return;
        }

        setImportPreview({ items, mode: 'append' });
      } catch {
        setImportError('檔案解析失敗，請確認是 .xlsx 或 .xls 格式');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }

  function confirmImport() {
    if (!importPreview) return;
    onImportMenuItems(selectedShopId, importPreview.items, importPreview.mode);
    setImportPreview(null);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* 系統標題 */}
      <div className="glass-card p-4">
        <h3 className="font-semibold text-white/80 mb-3">✏️ 系統標題</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="輸入顯示標題（例：公司名稱飲料團）"
            value={siteTitleInput}
            onChange={(e) => setSiteTitleInput(e.target.value)}
            className="flex-1 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <button
            onClick={() => onSetSiteTitle(siteTitleInput)}
            className="bg-orange-500/100 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >儲存</button>
        </div>
        <p className="text-xs text-white/40 mt-1.5">目前顯示：{siteTitle || '麻將飲料團'}</p>
      </div>

      {/* 團主驗證碼 */}
      <div className="glass-card p-4">
        <h3 className="font-semibold text-white/80 mb-3">🔒 團主驗證碼</h3>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="輸入 4~6 位數驗證碼"
            value={leaderCodeInput}
            onChange={(e) => setLeaderCodeInput(e.target.value)}
            className="flex-1 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <button
            onClick={() => onSetLeaderCode(leaderCodeInput)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >儲存</button>
        </div>
        <p className="text-xs text-white/40 mt-1.5">目前驗證碼：{leaderCode || '1212'}</p>
      </div>

      {/* 系統公告 */}
      <div className="glass-card p-4">
        <h3 className="font-semibold text-white/80 mb-3">📢 系統公告</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="輸入公告內容（留空表示關閉公告）"
            value={announcementInput}
            onChange={(e) => setAnnouncementInput(e.target.value)}
            className="flex-1 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <button
            onClick={() => onSetAnnouncement(announcementInput)}
            className="bg-orange-500/100 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >儲存</button>
        </div>
        {announcement && (
          <div className="mt-2 bg-amber-500/10 rounded-lg px-3 py-2 text-sm text-amber-300 flex justify-between items-center">
            <span>目前：{announcement}</span>
            <button onClick={() => { onSetAnnouncement(''); setAnnouncementInput(''); }} className="text-white/40 hover:text-red-400 ml-2 text-lg leading-none">×</button>
          </div>
        )}
      </div>

    </div>
  );
}
