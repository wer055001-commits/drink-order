import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

export default function MenuManager({ shops, onAddShop, onRemoveShop, onAddMenuItem, onRemoveMenuItem, onResetShops, onImportMenuItems, announcement, onSetAnnouncement }) {
  const [selectedShopId, setSelectedShopId] = useState(shops[0]?.id || '');
  const [announcementInput, setAnnouncementInput] = useState(announcement || '');
  const [newShopName, setNewShopName] = useState('');
  const [showAddShop, setShowAddShop] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', sizeL: '' });
  const [showAddItem, setShowAddItem] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importPreview, setImportPreview] = useState(null); // { items, mode }
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);

  const shop = shops.find((s) => s.id === selectedShopId);

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
          <label className="font-semibold text-gray-700 flex-1">飲料店</label>
          <button
            onClick={() => setShowAddShop(!showAddShop)}
            className="text-sm text-orange-500 font-medium hover:text-orange-600"
          >
            + 新增店家
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            重設預設
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
                onClick={() => setSelectedShopId(s.id)}
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
    </div>
  );
}
