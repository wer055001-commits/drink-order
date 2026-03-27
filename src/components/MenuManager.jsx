import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { AnimatePresence, motion } from 'framer-motion';
import { parseNidinMenu, fuzzyScore, getLocation, formatDistance } from '../lib/nidinHelpers';

// ── 你訂匯入 Modal ──────────────────────────────────────────────────

function NidinImportModal({ onImport, onClose }) {
  const [tab, setTab] = useState('brand');       // 'brand' | 'nearby'
  const [step, setStep] = useState('search');    // search | brands | stores | preview
  const [query, setQuery] = useState('');
  const [brands, setBrands] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);  // { lat, lng }
  const [locLoading, setLocLoading] = useState(false);

  async function requestLocation() {
    setLocLoading(true); setError('');
    try {
      const loc = await getLocation();
      setLocation(loc);
    } catch (e) { setError(e.message); }
    finally { setLocLoading(false); }
  }

  // 品牌名稱搜尋（模糊）
  async function searchByBrandName() {
    if (!query.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/nidin?path=brands');
      const data = await res.json();
      const q = query.trim();
      const scored = (data.brands || [])
        .map((b) => ({ ...b, _score: Math.max(fuzzyScore(b.name, q), fuzzyScore(b.name_short || '', q)) }))
        .filter((b) => b._score > 0)
        .sort((a, b) => b._score - a._score);
      setBrands(scored);
      setStep('brands');
    } catch { setError('搜尋失敗，請再試一次'); }
    finally { setLoading(false); }
  }

  // 附近搜尋（位置 + 關鍵字）
  async function searchNearby() {
    if (!location) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/nidin?path=search/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: location.lat, longitude: location.lng, keyword: query.trim(), shopper_id: null, src_type: 0, page: 1, count: 30 }),
      });
      const data = await res.json();
      setBrands(data.brand?.list || []);
      setStep('brands');
    } catch { setError('搜尋失敗，請再試一次'); }
    finally { setLoading(false); }
  }

  function handleSearch() {
    if (tab === 'brand') searchByBrandName();
    else searchNearby();
  }

  async function selectBrand(brand) {
    setSelectedBrand(brand); setLoading(true); setError('');
    try {
      let loc = location;
      if (!loc) {
        try { loc = await getLocation(); setLocation(loc); } catch { /* 無定位，回退全台列表 */ }
      }

      let data;
      if (loc) {
        const res = await fetch(
          `/api/nidin?path=store/listByPositionNew&latitude=${loc.lat}&longitude=${loc.lng}&page=1&count=30&src_type=3`,
          { headers: { 'x-nidin-brand': brand.brand_code } }
        );
        data = await res.json();
      } else {
        const res = await fetch(`/api/nidin?path=brand/${brand.id}/stores`);
        data = await res.json();
      }
      setStores(data.stores || []);
      setStep('stores');
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
    const map = { brands: 'search', stores: 'brands', preview: 'stores' };
    setStep(map[step] || 'search');
  }

  const stepTitle = { search: '從你訂匯入', brands: `「${query || '附近'}」結果`, stores: selectedBrand?.name, preview: '確認匯入' };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg flex flex-col"
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
                <button onClick={goBack} className="text-gray-400 hover:text-gray-600 text-xl pr-1">←</button>
              )}
              <h3 className="font-bold text-gray-800 text-lg">{stepTitle[step]}</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
          </div>
          {/* Tab 切換（只在 search 步驟顯示） */}
          {step === 'search' && (
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button onClick={() => setTab('brand')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'brand' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500'}`}
              >🔍 品牌名稱</button>
              <button onClick={() => { setTab('nearby'); if (!location) requestLocation(); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'nearby' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500'}`}
              >📍 附近搜尋</button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 pb-4">
          {step === 'search' && tab === 'brand' && (
            <div className="space-y-3 pt-1">
              <p className="text-sm text-gray-500">支援模糊搜尋，打「50嵐」「五十嵐」「50l」都能找到</p>
              <div className="flex gap-2">
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="輸入店家名稱..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  autoFocus
                />
                <button onClick={handleSearch} disabled={loading || !query.trim()}
                  className="bg-orange-500 text-white px-5 py-3 rounded-xl font-medium text-sm disabled:opacity-40"
                >{loading ? '...' : '搜尋'}</button>
              </div>
            </div>
          )}

          {step === 'search' && tab === 'nearby' && (
            <div className="space-y-3 pt-1">
              {!location ? (
                <div className="text-center py-6">
                  {locLoading ? (
                    <p className="text-gray-400 text-sm">定位中...</p>
                  ) : (
                    <>
                      <p className="text-4xl mb-3">📍</p>
                      <p className="text-gray-600 text-sm mb-4">需要你的位置才能搜尋附近店家</p>
                      <button onClick={requestLocation}
                        className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-medium text-sm"
                      >允許定位</button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-sm text-green-600 flex items-center gap-1">✓ 已取得位置</p>
                  <div className="flex gap-2">
                    <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="輸入類別或店名（例：牛肉麵、飲料）"
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                      autoFocus
                    />
                    <button onClick={handleSearch} disabled={loading}
                      className="bg-orange-500 text-white px-5 py-3 rounded-xl font-medium text-sm disabled:opacity-40"
                    >{loading ? '...' : '搜尋'}</button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'brands' && (
            <div className="space-y-1">
              {brands.length === 0 ? (
                <p className="text-center text-gray-400 py-6 text-sm">找不到相關店家，請換個關鍵字</p>
              ) : brands.map((b) => (
                <button key={b.id} onClick={() => selectBrand(b)}
                  className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-orange-50 transition-colors"
                >
                  {b.image
                    ? <img src={b.image} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />
                    : <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-lg shrink-0">🍱</div>
                  }
                  <div>
                    <div className="font-medium text-gray-800">{b.name}</div>
                    <div className="text-xs text-gray-400">{b.meal_tag_info?.map((t) => t.name).join('・')}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 'stores' && (
            <div className="space-y-1">
              {loading ? (
                <p className="text-center text-gray-400 py-6">載入中...</p>
              ) : stores.length === 0 ? (
                <p className="text-center text-gray-400 py-6 text-sm">此品牌目前無可選分店</p>
              ) : stores.map((s) => (
                <button key={s.id} onClick={() => selectStore(s)}
                  className="w-full text-left px-3 py-3 rounded-xl hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-800">{s.name}</div>
                    {s.distance != null && (
                      <span className="text-xs text-orange-500 font-medium shrink-0 ml-2">{formatDistance(s.distance)}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{s.address}</div>
                </button>
              ))}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-3">
              {loading ? <p className="text-center text-gray-400 py-6">載入菜單中...</p> : (
                <>
                  <div className="bg-orange-50 rounded-xl px-4 py-3">
                    <p className="font-semibold text-orange-800">{selectedBrand?.name} {selectedStore?.name}</p>
                    <p className="text-sm text-orange-600 mt-0.5">共 {menuItems.length} 個品項</p>
                    {selectedStore?.tel && <p className="text-xs text-orange-500 mt-0.5">📞 {selectedStore.tel}</p>}
                  </div>
                  <div className="space-y-1 max-h-52 overflow-y-auto">
                    {menuItems.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm text-gray-600 py-1.5 border-b last:border-0">
                        <span>{item.name}</span>
                        <span className="text-gray-400">NT${item.price}</span>
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
              className="w-full bg-orange-500 text-white py-3.5 rounded-2xl font-semibold text-base hover:bg-orange-600"
              whileTap={{ scale: 0.97 }}
            >新增店家並匯入菜單</motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── 主元件 ──────────────────────────────────────────────────────────
export default function MenuManager({ shops, onAddShop, onUpdateShop, onRemoveShop, onAddMenuItem, onRemoveMenuItem, onResetShops, onImportMenuItems, announcement, onSetAnnouncement }) {
  const [selectedShopId, setSelectedShopId] = useState(shops[0]?.id || '');
  const [announcementInput, setAnnouncementInput] = useState(announcement || '');
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
  useState(() => { setPhoneInput(shop?.phone || ''); });
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
      {/* 系統公告 */}
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-semibold text-gray-700 mb-3">📢 系統公告</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="輸入公告內容（留空表示關閉公告）"
            value={announcementInput}
            onChange={(e) => setAnnouncementInput(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <button
            onClick={() => onSetAnnouncement(announcementInput)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >儲存</button>
        </div>
        {announcement && (
          <div className="mt-2 bg-amber-50 rounded-lg px-3 py-2 text-sm text-amber-700 flex justify-between items-center">
            <span>目前：{announcement}</span>
            <button onClick={() => { onSetAnnouncement(''); setAnnouncementInput(''); }} className="text-gray-400 hover:text-red-400 ml-2 text-lg leading-none">×</button>
          </div>
        )}
      </div>

      {/* 店家切換 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center gap-2 mb-3">
          <label className="font-semibold text-gray-700 flex-1">店家</label>
          <button
            onClick={() => setShowNidinModal(true)}
            className="text-sm text-green-600 font-medium hover:text-green-700 flex items-center gap-1"
          >
            🔗 從你訂匯入
          </button>
          <button
            onClick={() => setShowAddShop(!showAddShop)}
            className="text-sm text-orange-500 font-medium hover:text-orange-600"
          >
            + 手動新增
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            重設
          </button>
        </div>

        {showAddShop && (
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="店家名稱"
              value={newShopName}
              onChange={(e) => setNewShopName(e.target.value)}
              className="flex-1 border rounded-lg p-2 text-sm"
            />
            <button
              onClick={handleAddShop}
              className="bg-orange-500 text-white px-3 py-2 rounded-lg text-sm font-medium"
            >
              新增
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {shops.map((s) => (
            <div key={s.id} className="flex items-center gap-1">
              <button
                onClick={() => handleSelectShop(s.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedShopId === s.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s.name}
              </button>
              {shops.length > 1 && (
                <button
                  onClick={() => {
                    onRemoveShop(s.id);
                    if (selectedShopId === s.id) setSelectedShopId(shops.find((x) => x.id !== s.id)?.id || '');
                  }}
                  className="text-gray-300 hover:text-red-400 text-lg leading-none"
                  title="刪除店家"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 確認重設 */}
      {showResetConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 font-medium mb-3">確定要將所有菜單重設回預設值嗎？</p>
          <div className="flex gap-2">
            <button
              onClick={() => { onResetShops(); setSelectedShopId(shops[0]?.id || ''); setShowResetConfirm(false); }}
              className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium"
            >
              確定重設
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 店家電話 */}
      {shop && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">📞 {shop.name} 電話</h3>
          <div className="flex gap-2">
            <input
              type="tel"
              placeholder="輸入此分店電話（如 02-2345-6789）"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button
              onClick={() => onUpdateShop(shop.id, { phone: phoneInput.trim() })}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >儲存</button>
          </div>
          {shop.phone && (
            <a href={`tel:${shop.phone}`} className="mt-2 flex items-center gap-1 text-sm text-orange-500 hover:underline">
              <span>📲</span><span>撥打 {shop.phone}</span>
            </a>
          )}
        </div>
      )}

      {/* 品項列表 */}
      {shop && (
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">{shop.name} 菜單</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddItem(!showAddItem)}
                className="text-sm text-orange-500 font-medium hover:text-orange-600"
              >
                + 手動新增
              </button>
            </div>
          </div>

          {showAddItem && (
            <div className="bg-orange-50 rounded-lg p-3 mb-4 space-y-2">
              <input
                type="text"
                placeholder="飲料名稱"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full border rounded-lg p-2 text-sm"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">M 售價（NT$）</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="w-full border rounded-lg p-2 text-sm mt-0.5"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">L 加價（留空表示無大杯）</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={newItem.sizeL}
                    onChange={(e) => setNewItem({ ...newItem, sizeL: e.target.value })}
                    className="w-full border rounded-lg p-2 text-sm mt-0.5"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddItem} className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm font-medium">新增</button>
                <button onClick={() => setShowAddItem(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm">取消</button>
              </div>
            </div>
          )}

          {shop.menu.length === 0 ? (
            <div className="text-center text-gray-400 py-4 text-sm">尚無品項</div>
          ) : (
            <div className="space-y-2">
              {shop.menu.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <span className="font-medium text-gray-800">{item.name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      NT${item.price}
                      {item.sizes.length > 1 && ` / L +${item.sizes[1].add}`}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemoveMenuItem(shop.id, item.id)}
                    className="text-gray-300 hover:text-red-400 text-lg leading-none px-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Excel 匯入區塊 */}
      {shop && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">匯入 Excel 菜單</h3>

          <div className="flex gap-2 mb-3">
            <button
              onClick={downloadTemplate}
              className="flex-1 border border-orange-400 text-orange-500 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors"
            >
              下載範本
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              選擇 Excel 檔案
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <p className="text-xs text-gray-400">格式：第一欄「品項名稱」、第二欄「M價格」、第三欄「L加價」（選填）</p>

          {importError && (
            <div className="mt-3 bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2">{importError}</div>
          )}

          {importPreview && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="font-medium text-green-800 mb-2">
                偵測到 {importPreview.items.length} 筆品項，匯入到「{shop.name}」
              </p>

              {/* 匯入清單預覽 */}
              <div className="max-h-40 overflow-y-auto mb-3 space-y-1">
                {importPreview.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-gray-600">
                    <span>{item.name}</span>
                    <span>NT${item.price}{item.sizes.length > 1 ? ` / L +${item.sizes[1].add}` : ''}</span>
                  </div>
                ))}
              </div>

              {/* 附加 or 取代 */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setImportPreview({ ...importPreview, mode: 'append' })}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    importPreview.mode === 'append'
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 text-gray-600'
                  }`}
                >
                  附加到現有品項
                </button>
                <button
                  onClick={() => setImportPreview({ ...importPreview, mode: 'replace' })}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    importPreview.mode === 'replace'
                      ? 'border-red-500 bg-red-500 text-white'
                      : 'border-gray-300 text-gray-600'
                  }`}
                >
                  取代所有品項
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={confirmImport}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700"
                >
                  確認匯入
                </button>
                <button
                  onClick={() => setImportPreview(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 客製選項說明 */}
      <div className="bg-gray-50 rounded-xl p-4 border text-sm text-gray-500">
        <p className="font-medium text-gray-600 mb-1">客製選項（全店共用）</p>
        <p>甜度：全糖、少糖、半糖、微糖、無糖</p>
        <p>冰塊：正常冰、少冰、微冰、去冰、熱</p>
        <p>加料：珍珠、椰果、布丁、仙草、芋圓</p>
      </div>

      {/* 你訂匯入 Modal */}
      <AnimatePresence>
        {showNidinModal && (
          <NidinImportModal
            onImport={handleNidinImport}
            onClose={() => setShowNidinModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
