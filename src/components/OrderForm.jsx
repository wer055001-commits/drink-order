import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCountdown } from '../hooks/useCountdown';
import { parseNidinMenu, fuzzyScore, getLocation, formatDistance, calcDistance } from '../lib/nidinHelpers';
import { Clock, Plus, Users, Send, Store, Search, MapPin, ChevronLeft, ShoppingBag, Check } from 'lucide-react';

const DURATION_OPTIONS = [15, 20, 30, 45, 60];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── 個別團購單卡片（清單用）─────────────────────────────────────
function SessionCard({ session, sessionOrders, onOrder, onProxyOrder, onExtend, onClose, onReset, onContinue, isLeader }) {
  const { isExpired, display, secondsLeft } = useCountdown(session.expiresAt);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const isStale = session.date !== todayStr();
  const canOrder = !isExpired && !isStale;
  const timeColor = isExpired
    ? 'text-red-400'
    : secondsLeft <= 120
    ? 'text-red-500'
    : secondsLeft <= 300
    ? 'text-amber-500'
    : 'text-green-400';

  return (
    <motion.div
      className={`glass-card p-4 space-y-3 ${isExpired ? 'opacity-60' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-bold text-lg">{session.shopName}</div>
          <div className="text-sm text-white/40">{session.date}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/40 mb-0.5">剩餘時間</div>
          <div className={`font-bold ${timeColor}`}>{isExpired ? '已截止' : display}</div>
        </div>
      </div>

      <div className="text-sm text-white/50">
        目前 <span className="font-semibold text-white/80">{sessionOrders.length}</span> 筆訂單
      </div>

      {isStale && isLeader && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          <p className="text-sm text-amber-300 font-medium mb-2">此為昨日或更早的團購單</p>
          <div className="flex gap-2">
            <button onClick={() => onContinue(session.id)} className="flex-1 text-sm bg-amber-500/100 text-white py-1.5 rounded-xl font-medium hover:bg-amber-600 transition-colors">繼續此單</button>
            <button onClick={() => setConfirmReset(true)} className="flex-1 text-sm bg-white/5 text-white/60 py-1.5 rounded-xl font-medium hover:bg-white/10 transition-colors">刪除</button>
          </div>
        </div>
      )}

      {isLeader && !isStale && (
        <div className="flex gap-2 flex-wrap">
          {!isExpired && (
            <>
              <motion.button onClick={() => onExtend(session.id, 15)} className="text-xs font-medium border border-blue-500/20 text-blue-500 px-3 py-1.5 rounded-xl hover:bg-blue-500/100/10 transition-colors cursor-pointer flex items-center gap-1" whileTap={{ scale: 0.95 }}><Clock className="w-3 h-3" /> +15 分鐘</motion.button>
              <motion.button onClick={() => onProxyOrder(session.id)} className="text-xs font-medium border border-purple-200 text-purple-500 px-3 py-1.5 rounded-xl hover:bg-purple-500/10 transition-colors cursor-pointer flex items-center gap-1" whileTap={{ scale: 0.95 }}><Users className="w-3 h-3" /> 代點</motion.button>
              {secondsLeft <= 300 && (
                <motion.button
                  onClick={() => {
                    const text = `⏰ 飲料快截止了！剩 ${display}，還沒點的快來！\n${window.location.href}`;
                    window.open(`https://line.me/R/share?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="text-xs font-medium border border-orange-500/20 text-orange-500 px-3 py-1.5 rounded-xl hover:bg-orange-500/100/10 transition-colors animate-pulse cursor-pointer flex items-center gap-1"
                  whileTap={{ scale: 0.95 }}
                ><Send className="w-3 h-3" /> 提醒成員</motion.button>
              )}
            </>
          )}
          <motion.button onClick={() => setConfirmClose(true)} className="text-xs font-medium border border-white/10 text-white/50 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer" whileTap={{ scale: 0.95 }}>關閉</motion.button>
          <motion.button onClick={() => setConfirmReset(true)} className="text-xs font-medium border border-red-100 text-red-400 px-3 py-1.5 rounded-xl hover:bg-red-500/100/10 transition-colors cursor-pointer" whileTap={{ scale: 0.95 }}>重置</motion.button>
        </div>
      )}

      {!isLeader && (
        canOrder ? (
          <motion.button
            onClick={() => onOrder(session.id)}
            className="w-full bg-orange-500/100 text-white py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            我要點餐 →
          </motion.button>
        ) : isStale ? (
          <div className="text-center text-sm text-white/40 py-2">此團購單已過期（跨日）</div>
        ) : (
          <div className="text-center text-sm text-red-400 py-2">⏰ 點餐時間已截止，請聯絡團主延長</div>
        )
      )}

      <AnimatePresence>
        {confirmClose && (
          <motion.div
            className="bg-white/5 border rounded-xl p-3 space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <p className="text-sm font-medium text-white/80">關閉此團購單？（{sessionOrders.length} 筆訂單將保留在歷史紀錄）</p>
            <div className="flex gap-2">
              <button onClick={() => { onClose(session.id); setConfirmClose(false); }} className="flex-1 text-sm bg-orange-500/100 text-white py-1.5 rounded-xl font-medium">確定關閉</button>
              <button onClick={() => setConfirmClose(false)} className="flex-1 text-sm bg-white/5 text-white/60 py-1.5 rounded-xl font-medium">取消</button>
            </div>
          </motion.div>
        )}

        {confirmReset && (
          <motion.div
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <p className="text-sm font-medium text-red-300">重置此團購單？所有 {sessionOrders.length} 筆訂單將被刪除。</p>
            <div className="flex gap-2">
              <button onClick={() => { onReset(session.id); setConfirmReset(false); }} className="flex-1 text-sm bg-red-500/100 text-white py-1.5 rounded-xl font-medium">確定刪除</button>
              <button onClick={() => setConfirmReset(false)} className="flex-1 text-sm bg-white/5 text-white/60 py-1.5 rounded-xl font-medium">取消</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── 你訂店家選擇器（內嵌在開團流程）───────────────────────────────
function NidinPicker({ onSelectStore, onCancel }) {
  const [step, setStep] = useState('search');  // 'search' | 'stores'
  const [query, setQuery] = useState('');
  const [allBrands, setAllBrands] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [storeLoading, setStoreLoading] = useState(false);
  const [error, setError] = useState('');
  const [radiusKm, setRadiusKm] = useState(10);
  const locationRef = useRef(null);

  // 掛載時：取得定位 + 品牌清單
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
            const key = b.brand_code || b.id;
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
    setSelectedBrand(brand); setStoreLoading(true); setError(''); setStep('stores');
    try {
      let loc = locationRef.current;
      if (!loc) {
        try { loc = await getLocation(); locationRef.current = loc; } catch {}
      }

      let result = [];

      if (loc) {
        // 方法1：listByPositionNew + brand_code
        if (brand.brand_code) {
          const res = await fetch(
            `/api/nidin?path=store/listByPositionNew&latitude=${loc.lat}&longitude=${loc.lng}&page=1&count=50&src_type=3`,
            { headers: { 'x-nidin-brand': brand.brand_code } }
          );
          const data = await res.json();
          result = data.stores || data.store_list || [];
        }

        // 方法2：附近全部，前端過濾品牌名
        if (result.length === 0) {
          const brandName = brand.name?.toLowerCase() || '';
          result = nearbyStores.filter((s) =>
            s.brand_name?.toLowerCase().includes(brandName) ||
            s.name?.toLowerCase().includes(brandName)
          );
        }

        // 方法3：全台清單 + Haversine 篩選
        if (result.length === 0 && brand.id) {
          const res = await fetch(`/api/nidin?path=brand/${brand.id}/stores`);
          const data = await res.json();
          const radiusM = radiusKm * 1000;
          result = (data.stores || [])
            .map((s) => {
              const sLat = parseFloat(s.lat ?? s.latitude ?? s.location?.lat ?? '');
              const sLng = parseFloat(s.lng ?? s.longitude ?? s.lon ?? s.location?.lng ?? '');
              const dist = !isNaN(sLat) && !isNaN(sLng) ? calcDistance(loc.lat, loc.lng, sLat, sLng) : null;
              return { ...s, distance: dist };
            })
            .filter((s) => s.distance !== null && s.distance <= radiusM)
            .sort((a, b) => a.distance - b.distance);
        }
      } else {
        if (brand.id) {
          const res = await fetch(`/api/nidin?path=brand/${brand.id}/stores`);
          const data = await res.json();
          result = data.stores || [];
        }
      }

      setStores(result);
    } catch { setError('無法取得分店列表'); }
    finally { setStoreLoading(false); }
  }

  async function selectStore(store, brandName) {
    setStoreLoading(true); setError('');
    try {
      const res = await fetch(`/api/nidin?path=store/${store.id}/onShelfMenu`);
      const menuData = await res.json();
      const storeBrand = brandName || selectedBrand?.name || store.brand_name || '';
      onSelectStore({
        name: `${storeBrand} ${store.name}`.trim(),
        phone: store.tel || '',
        nidinStoreId: store.id,
        menuData,
      });
    } catch { setError('無法取得菜單，請換一家店'); }
    finally { setStoreLoading(false); }
  }

  return (
    <div className="space-y-3">
      {/* 返回列 */}
      {step === 'stores' && (
        <button onClick={() => { setStep('search'); setStores([]); setSelectedBrand(null); }}
          className="flex items-center gap-1 text-sm cursor-pointer" style={{ color: 'var(--text-muted)' }}
        ><ChevronLeft className="w-4 h-4" /> 返回搜尋</button>
      )}

      {/* 搜尋輸入 + 即時建議 */}
      {step === 'search' && (
        <div className="space-y-3">
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋飲料品牌（例：50嵐、迷客夏）"
            className="dark-input w-full"
            autoFocus
          />
          <div className="flex items-center gap-3 px-1">
            <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>搜尋範圍</span>
            <input type="range" min="1" max="50" value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs font-bold text-orange-500 w-12 text-right shrink-0">{radiusKm} km</span>
          </div>

          {/* 熱門品牌快捷 */}
          {!query.trim() && (
            <div className="space-y-2">
              <p className="text-xs font-semibold px-1" style={{ color: 'var(--text-muted)' }}>熱門品牌</p>
              <div className="flex flex-wrap gap-2">
                {['50嵐', '迷客夏', '清心福全', '茶湯會', 'CoCo', '鮮茶道', '大苑子', '可不可'].map((name) => (
                  <button key={name} onClick={() => setQuery(name)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  >{name}</button>
                ))}
              </div>
            </div>
          )}

          {/* 搜尋結果 */}
          {query.trim() && (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {allBrands.length === 0 && <p className="text-xs text-center py-3" style={{ color: 'var(--text-muted)' }}>品牌載入中...</p>}
              {allBrands.length > 0 && suggestions.length === 0 && (
                <p className="text-sm text-center py-3" style={{ color: 'var(--text-muted)' }}>找不到「{query}」，請換個關鍵字</p>
              )}
              {suggestions.map((b) => (
                <button key={b.brand_code || b.id} onClick={() => selectBrand(b)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-colors"
                  style={{ border: '1px solid var(--border)' }}
                >
                  {b.image
                    ? <img src={b.image} className="w-9 h-9 rounded-lg object-cover shrink-0" alt="" />
                    : <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--surface)' }}><Store className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /></div>
                  }
                  <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>{b.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 品牌分店列表 */}
      {step === 'stores' && (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {storeLoading && <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>搜尋附近分店中...</p>}
          {!storeLoading && stores.length === 0 && <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>此品牌附近無分店</p>}
          {stores.map((s) => (
            <button key={s.id} onClick={() => selectStore(s)} disabled={storeLoading}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left cursor-pointer disabled:opacity-50 transition-colors"
              style={{ border: '1px solid var(--border)' }}
            >
              <div>
                <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>{s.name}</div>
                {s.address && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.address}</div>}
              </div>
              {s.distance != null && (
                <span className="text-xs text-orange-400 font-bold shrink-0 ml-2">{formatDistance(s.distance)}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {storeLoading && step !== 'stores' && <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>載入中...</p>}
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <button onClick={onCancel} className="w-full text-sm py-1 cursor-pointer" style={{ color: 'var(--text-muted)' }}>取消</button>
    </div>
  );
}

// ── 建立新團購單表單（團主/管理者）──────────────────────────────
function CreateSessionForm({ shops, onStartSession, onStartSessionFromNidin, onBack }) {
  const [duration, setDuration] = useState(30);
  const [nidinStore, setNidinStore] = useState(null);
  const [creating, setCreating] = useState(false);

  async function handleCreateFromNidin() {
    if (!nidinStore || creating) return;
    setCreating(true);
    await onStartSessionFromNidin(nidinStore, duration);
    setCreating(false);
    onBack();
  }

  const DurationSelector = () => (
    <div>
      <label className="block text-sm font-semibold text-white/60 mb-2">開放點餐時間</label>
      <div className="flex flex-wrap gap-2">
        {DURATION_OPTIONS.map((d) => (
          <motion.button key={d} type="button" onClick={() => setDuration(d)}
            className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-colors ${duration === d ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-white/10 text-white/60 hover:border-orange-300'}`}
            whileTap={{ scale: 0.95 }}
          >{d} 分鐘</motion.button>
        ))}
        <div className="flex items-center gap-1">
          <input type="number" min="1" max="10080" placeholder="自訂"
            className="w-16 border border-white/10 rounded-xl p-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-300"
            onChange={(e) => { const v = parseInt(e.target.value, 10); if (v > 0) setDuration(v); }}
          />
          <span className="text-sm text-white/50">分鐘</span>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      className="max-w-2xl mx-auto px-4 py-6"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25 }}
    >
      <div className="bg-white/5 rounded-2xl shadow-sm border border-white/10 p-5 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-white/50 hover:text-orange-500">← 返回</button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <h2 className="text-lg font-bold text-white/80">建立新的團購單</h2>
          </div>
        </div>

        {/* 搜尋店家 */}
        {!nidinStore && (
          <NidinPicker
            onSelectStore={setNidinStore}
            onCancel={onBack}
          />
        )}

        {/* 已選好店家 */}
        {nidinStore && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/20 rounded-2xl px-4 py-3">
              <div>
                <p className="font-semibold" style={{ color: "var(--text)" }}>{nidinStore.name}</p>
                {nidinStore.phone && <p className="text-xs text-white/50 mt-0.5">📞 {nidinStore.phone}</p>}
              </div>
              <button onClick={() => setNidinStore(null)} className="text-xs text-white/40 hover:text-red-500">重選</button>
            </div>
            <DurationSelector />
            <motion.button
              onClick={handleCreateFromNidin}
              disabled={creating}
              className="w-full bg-orange-500/100 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-60 transition-colors"
              whileTap={{ scale: 0.98 }}
            >{creating ? '建立中...' : `建立團購單（限時 ${duration} 分鐘）`}</motion.button>
          </div>
        )}

      </div>
    </motion.div>
  );
}

// ── 點餐表單──────────────────────────────────────────────────────
function OrderFormContent({ session, shop, onAddOrder, onBack, savedName, isProxy }) {
  const { isExpired, display, secondsLeft } = useCountdown(session.expiresAt);
  const [name, setName] = useState(savedName || '');
  const [selectedItem, setSelectedItem] = useState(null);
  const [size, setSize] = useState('');
  const [sugar, setSugar] = useState('全糖');
  const [ice, setIce] = useState('正常冰');
  const [toppings, setToppings] = useState([]);
  const [note, setNote] = useState('');
  const [drinkSearch, setDrinkSearch] = useState('');
  const optionsRef = useState(null)[0];
  const optionsDivRef = { current: null };

  const filteredMenu = drinkSearch.trim()
    ? shop.menu.filter((item) => item.name.includes(drinkSearch.trim()))
    : shop.menu;

  function handleItemSelect(item) {
    setSelectedItem(item);
    setSize(item.sizes[0]?.label || '');
    setToppings([]);
    // 選完飲料後自動滑到選項區
    setTimeout(() => {
      optionsDivRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  function toggleTopping(t) {
    setToppings((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  function calcPrice() {
    if (!selectedItem) return 0;
    const sizeObj = selectedItem.sizes.find((s) => s.label === size);
    return selectedItem.price + (sizeObj?.add || 0);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !selectedItem || isExpired) return;
    onAddOrder({
      name: name.trim(),
      shopId: shop.id,
      shopName: shop.name,
      drink: selectedItem.name,
      size,
      sugar,
      ice,
      toppings: [],
      price: calcPrice(),
      note: note.trim(),
    });
  }

  const timeColor = isExpired ? 'text-red-400' : secondsLeft <= 120 ? 'text-red-500' : secondsLeft <= 300 ? 'text-amber-500' : 'text-green-400';

  const orderSummary = selectedItem
    ? `${selectedItem.name}（${size}）・${sugar}・${ice}${note ? '・' + note : ''}`
    : null;

  return (
    <motion.div
      className="max-w-2xl mx-auto px-4 py-4"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={onBack} className="text-sm text-white/50 hover:text-orange-500 transition-colors">← 返回列表</button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/50">{shop.name}</span>
          <span className={`font-bold ${timeColor}`}>{isExpired ? '已截止' : display}</span>
        </div>
      </div>

      {isProxy && (
        <div className="rounded-xl px-4 py-2.5 mb-3 text-sm font-medium" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: 'var(--text-secondary)' }}>
          👥 代點模式 — 請填入對方姓名
        </div>
      )}

      <AnimatePresence>
        {!isExpired && secondsLeft <= 120 && (
          <motion.div
            className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-2.5 mb-3 flex items-center gap-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <span className="text-lg">⚠️</span>
            <p className="text-sm font-semibold text-red-300">點餐即將截止！剩餘 {display}，請盡快送出</p>
          </motion.div>
        )}
      </AnimatePresence>

      {isExpired ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center space-y-2">
          <p className="text-2xl">⏰</p>
          <p className="text-red-300 font-bold text-lg">點餐時間已截止</p>
          <p className="text-red-400 text-sm">請聯絡團主延長時間</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div className="bg-white/5 rounded-2xl shadow-sm border border-white/10 p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <label className="block text-sm font-semibold text-white/60 mb-2">你的姓名</label>
            <input type="text" placeholder="請輸入姓名" value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-300" required
            />
          </motion.div>

          <motion.div className="bg-white/5 rounded-2xl shadow-sm border border-white/10 p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <label className="block text-sm font-semibold text-white/60 mb-2">選擇飲料</label>
            {shop.menu.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-4">此店家尚無品項，請先至「菜單管理」新增飲料。</p>
            ) : (
              <>
                {shop.menu.length > 6 && (
                  <input
                    type="text"
                    placeholder="搜尋飲料名稱..."
                    value={drinkSearch}
                    onChange={(e) => setDrinkSearch(e.target.value)}
                    className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                )}
                <div className="grid grid-cols-2 gap-2">
                  {filteredMenu.map((item) => (
                    <motion.button type="button" key={item.id} onClick={() => handleItemSelect(item)}
                      className={`p-3 rounded-xl border-2 text-left transition-colors ${selectedItem?.id === item.id ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 hover:border-orange-300'}`}
                      whileTap={{ scale: 0.97 }}
                    >
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-orange-500">
                        NT${item.price}
                        {item.sizes.length > 1 && item.sizes.slice(1).map((s) => s.add > 0 ? ` / ${s.label} +${s.add}` : '').join('')}
                      </div>
                    </motion.button>
                  ))}
                  {filteredMenu.length === 0 && (
                    <p className="col-span-2 text-center text-sm text-white/40 py-4">找不到「{drinkSearch}」</p>
                  )}
                </div>
              </>
            )}
          </motion.div>

          <AnimatePresence>
            {selectedItem && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                ref={(el) => { optionsDivRef.current = el; }}
              >
                {selectedItem.sizes.length > 1 && (
                  <div className="bg-white/5 rounded-2xl shadow-sm border border-white/10 p-4">
                    <label className="block text-sm font-semibold text-white/60 mb-2">尺寸</label>
                    <div className="flex gap-2">
                      {selectedItem.sizes.map((s) => (
                        <motion.button type="button" key={s.label} onClick={() => setSize(s.label)}
                          className={`flex-1 py-2 rounded-xl border-2 font-medium transition-colors ${size === s.label ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-white/10 text-white/60 hover:border-orange-300'}`}
                          whileTap={{ scale: 0.97 }}
                        >{s.label} {s.add > 0 ? `+${s.add}` : ''}</motion.button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white/5 rounded-2xl shadow-sm border border-white/10 p-4">
                  <label className="block text-sm font-semibold text-white/60 mb-2">甜度</label>
                  <div className="flex flex-wrap gap-2">
                    {shop.options.sugar.map((s) => (
                      <motion.button type="button" key={s} onClick={() => setSugar(s)}
                        className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${sugar === s ? 'border-orange-500 bg-orange-500/100 text-white' : 'border-white/15 text-white/60 hover:border-orange-400'}`}
                        whileTap={{ scale: 0.95 }}
                      >{s}</motion.button>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl shadow-sm border border-white/10 p-4">
                  <label className="block text-sm font-semibold text-white/60 mb-2">冰塊</label>
                  <div className="flex flex-wrap gap-2">
                    {shop.options.ice.map((ic) => (
                      <motion.button type="button" key={ic} onClick={() => setIce(ic)}
                        className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${ice === ic ? 'border-blue-500 bg-blue-500/100 text-white' : 'border-white/15 text-white/60 hover:border-blue-400'}`}
                        whileTap={{ scale: 0.95 }}
                      >{ic}</motion.button>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl shadow-sm border border-white/10 p-4">
                  <label className="block text-sm font-semibold text-white/60 mb-2">備註（選填）</label>
                  <input type="text" placeholder="加料或其他需求（例：加珍珠、少冰）" value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="dark-input w-full"
                  />
                </div>

                <div className="bg-white/5 rounded-2xl shadow-sm border border-white/10 p-4 space-y-3">
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2 text-sm text-orange-300">
                    <span className="font-semibold">確認：</span>{orderSummary}
                    <span className="font-bold ml-2 text-orange-400">NT${calcPrice()}</span>
                  </div>
                  <motion.button
                    type="submit"
                    className="w-full bg-orange-500/100 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    加入訂單
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      )}
    </motion.div>
  );
}

// ── 主元件 ───────────────────────────────────────────────────────
export default function OrderForm({
  shops, activeSessions,
  onStartSession, onStartSessionFromNidin, onAddOrder,
  onCloseSession, onResetSession, onContinueSession, onExtendSession,
  getActiveSessionOrders, isLeader, onSaveUserName, getUserName,
}) {
  const [view, setView] = useState('list');
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [submittedFor, setSubmittedFor] = useState(null);
  const [isProxy, setIsProxy] = useState(false);

  const selectedSession = activeSessions.find((s) => s.id === selectedSessionId);

  const sortedSessions = [...activeSessions].sort((a, b) => {
    const aExpired = new Date(a.expiresAt) <= new Date();
    const bExpired = new Date(b.expiresAt) <= new Date();
    if (aExpired === bExpired) return 0;
    return aExpired ? 1 : -1;
  });

  if (view === 'create' && isLeader) {
    return (
      <CreateSessionForm
        shops={shops}
        onStartSession={onStartSession}
        onStartSessionFromNidin={onStartSessionFromNidin}
        onBack={() => setView('list')}
      />
    );
  }

  if (view === 'order' && selectedSession) {
    const shop = shops.find((s) => s.id === selectedSession.shopId);
    return (
      <OrderFormContent
        session={selectedSession}
        shop={shop}
        savedName={isProxy ? '' : (getUserName ? getUserName() : '')}
        isProxy={isProxy}
        onAddOrder={(orderData) => {
          onAddOrder(orderData, selectedSessionId);
          if (onSaveUserName && !isProxy) onSaveUserName(orderData.name);
          setSubmittedFor(selectedSessionId);
          setTimeout(() => {
            setSubmittedFor(null);
            if (isProxy) {
              // 代點模式：直接回到代點表單（清空姓名繼續代點）
              setView('order');
            } else {
              setView('list');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }, 1500);
        }}
        onBack={() => setView('list')}
      />
    );
  }

  return (
    <motion.div
      className="max-w-2xl mx-auto px-4 py-4 space-y-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AnimatePresence>
        {submittedFor && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/5 rounded-3xl px-12 py-10 text-center shadow-2xl"
              initial={{ scale: 0.4, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
            >
              <motion.div
                className="text-7xl mb-4"
                animate={{ rotate: [0, -15, 15, -8, 8, 0], scale: [1, 1.15, 1] }}
                transition={{ delay: 0.15, duration: 0.6 }}
              >✅</motion.div>
              <p className="text-2xl font-bold text-white">訂單送出！</p>
              <p className="text-white/50 mt-2 text-sm">{isProxy ? '準備代點下一位...' : '下一位可以開始點了'}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeSessions.length === 0 ? (
        isLeader ? (
          <div className="text-center py-8 text-white/50">
            <motion.div
              className="text-5xl mb-4"
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >📋</motion.div>
            <p className="font-medium">尚無進行中的團購單</p>
            <p className="text-sm mt-1 text-white/40">點擊下方按鈕建立</p>
          </div>
        ) : (
          <div className="text-center py-16">
            <motion.div
              className="text-6xl mb-4"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >🧋</motion.div>
            <p className="text-white/60 font-medium text-lg">等待團主建立團購單</p>
            <p className="text-white/40 text-sm mt-2">請稍後，團主尚未開始本次點餐</p>
          </div>
        )
      ) : (
        sortedSessions.map((s) => (
          <SessionCard
            key={s.id}
            session={s}
            sessionOrders={getActiveSessionOrders(s.id)}
            onOrder={(id) => { setSelectedSessionId(id); setIsProxy(false); setView('order'); }}
            onProxyOrder={(id) => { setSelectedSessionId(id); setIsProxy(true); setView('order'); }}
            onExtend={onExtendSession}
            onClose={onCloseSession}
            onReset={onResetSession}
            onContinue={onContinueSession}
            isLeader={isLeader}
          />
        ))
      )}

      {isLeader && (
        <motion.button
          onClick={() => setView('create')}
          className="w-full bg-orange-500/100 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          ＋ 新增團購單
        </motion.button>
      )}
    </motion.div>
  );
}
