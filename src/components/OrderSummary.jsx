import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StatsCard from './StatsCard';

// ── 修改訂單 Modal ────────────────────────────────────────────────
function EditOrderModal({ order, shop, onSave, onClose }) {
  const [selectedItem, setSelectedItem] = useState(shop?.menu.find((m) => m.name === order.drink) || null);
  const [size, setSize] = useState(order.size);
  const [sugar, setSugar] = useState(order.sugar);
  const [ice, setIce] = useState(order.ice);
  const [toppings, setToppings] = useState(order.toppings || []);
  const [note, setNote] = useState(order.note || '');

  function calcPrice() {
    if (!selectedItem) return order.price;
    const sizeObj = selectedItem.sizes.find((s) => s.label === size);
    return selectedItem.price + (sizeObj?.add || 0);
  }

  function toggleTopping(t) {
    setToppings((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  function handleSave() {
    if (!selectedItem) return;
    onSave({ drink: selectedItem.name, size, sugar, ice, toppings: [], price: calcPrice(), note: note.trim() });
    onClose();
  }

  if (!shop) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="bg-white/5 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 space-y-4"
        initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-lg">✏️ 修改訂單</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white/60 text-2xl leading-none">×</button>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white/60 mb-2">飲料</label>
          <div className="grid grid-cols-2 gap-2">
            {shop.menu.map((item) => (
              <button type="button" key={item.id}
                onClick={() => { setSelectedItem(item); setSize(item.sizes[0]?.label || ''); setToppings([]); }}
                className={`p-3 rounded-xl border-2 text-left transition-colors ${selectedItem?.id === item.id ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 hover:border-orange-300'}`}
              >
                <div className="font-medium text-white text-sm">{item.name}</div>
                <div className="text-xs text-orange-500">NT${item.price}起</div>
              </button>
            ))}
          </div>
        </div>

        {selectedItem && selectedItem.sizes.length > 1 && (
          <div>
            <label className="block text-sm font-semibold text-white/60 mb-2">尺寸</label>
            <div className="flex gap-2">
              {selectedItem.sizes.map((s) => (
                <button type="button" key={s.label} onClick={() => setSize(s.label)}
                  className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-colors ${size === s.label ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-white/10 text-white/60'}`}
                >{s.label} {s.add > 0 ? `+${s.add}` : ''}</button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-white/60 mb-2">甜度</label>
          <div className="flex flex-wrap gap-2">
            {shop.options.sugar.map((s) => (
              <button type="button" key={s} onClick={() => setSugar(s)}
                className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${sugar === s ? 'border-orange-500 bg-orange-500/100 text-white' : 'border-white/15 text-white/60'}`}
              >{s}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white/60 mb-2">冰塊</label>
          <div className="flex flex-wrap gap-2">
            {shop.options.ice.map((ic) => (
              <button type="button" key={ic} onClick={() => setIce(ic)}
                className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${ice === ic ? 'border-blue-500 bg-blue-500/100 text-white' : 'border-white/15 text-white/60'}`}
              >{ic}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white/60 mb-2">備註（選填）</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="加料或其他需求（例：加珍珠、少冰）"
            className="dark-input w-full"
          />
        </div>

        {selectedItem && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2 text-sm text-orange-300">
            {selectedItem.name}（{size}）・{sugar}・{ice}{note ? '・' + note : ''}
            <span className="font-bold ml-2">NT${calcPrice()}</span>
          </div>
        )}

        <button onClick={handleSave}
          className="w-full bg-orange-500/100 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
        >儲存修改</button>
      </motion.div>
    </motion.div>
  );
}

function buildCopyText(orders, session) {
  if (!orders.length) return '';
  const shopName = session?.shopName || orders[0]?.shopName || '';
  const date = session?.date || '';
  let text = `【${shopName} ${date} 團購訂單】\n\n`;

  // 依人名分組，條列每人的飲料與價格
  const byName = {};
  orders.forEach((o) => {
    if (!byName[o.name]) byName[o.name] = [];
    const drink = `${o.drink}(${o.size}) ${o.sugar} ${o.ice}${o.note ? ' ' + o.note : ''}`;
    byName[o.name].push({ drink, price: o.price });
  });
  Object.entries(byName).forEach(([name, items]) => {
    const personTotal = items.reduce((s, i) => s + i.price, 0);
    text += `${name}（NT$${personTotal}）\n`;
    items.forEach(({ drink, price }) => {
      text += ` - ${drink}  NT$${price}\n`;
    });
    text += '\n';
  });

  const t = orders.reduce((s, o) => s + o.price, 0);
  text += `共 ${orders.length} 杯，合計 NT$${t}`;
  return text;
}


// ── 單一 session 的訂單區塊 ───────────────────────────────────────
function SessionSummary({ session, orders, shop, onRemoveOrder, onUpdateOrder, onClose, onReset, isLeader, myName }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [filterMine, setFilterMine] = useState(!isLeader);
  const [editingOrder, setEditingOrder] = useState(null);
  const isSessionOpen = new Date(session.expiresAt) > new Date();

  const displayOrders = filterMine && myName ? orders.filter((o) => o.name === myName) : orders;
  const total = displayOrders.reduce((sum, o) => sum + o.price, 0);
  const summary = displayOrders.reduce((acc, o) => {
    const key = `${o.drink}(${o.size}) ${o.sugar} ${o.ice}${o.note ? ' ' + o.note : ''}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const orderText = buildCopyText(orders, session);

  function handleCloseOnly() {
    onClose(session.id);
    setShowCloseModal(false);
  }

  function handleCloseAndLine() {
    onClose(session.id);
    setShowCloseModal(false);
    window.open(`https://line.me/R/share?text=${encodeURIComponent(orderText)}`, '_blank');
  }

  return (
    <div className="space-y-3">
      {/* Session 標題列 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-white/80 text-lg">{session.shopName}</h2>
            {shop?.phone && (
              <a href={`tel:${shop.phone}`}
                className="flex items-center gap-1 text-xs bg-green-500/15 text-green-300 px-2 py-0.5 rounded-full font-medium hover:bg-green-500/10"
              >📞 撥話</a>
            )}
          </div>
          <p className="text-xs text-white/40">{session.date}</p>
        </div>
        {isLeader && (
          <div className="flex gap-2 flex-wrap justify-end">
            <motion.button onClick={() => setShowCloseModal(true)}
              className="text-sm bg-orange-500/100 text-white px-3 py-1.5 rounded-xl font-medium hover:bg-orange-600"
              whileTap={{ scale: 0.95 }}
            >結單</motion.button>
            <motion.button onClick={() => setShowConfirm(true)}
              className="text-sm bg-white/5 text-white/80 px-3 py-1.5 rounded-xl font-medium hover:bg-white/10"
              whileTap={{ scale: 0.95 }}
            >重置</motion.button>
          </div>
        )}
      </div>

      {/* 結單確認 Modal */}
      <AnimatePresence>
        {showCloseModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowCloseModal(false); }}
          >
            <motion.div
              className="bg-white/5 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-6 space-y-4"
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-lg">結單確認</h3>
                <button onClick={() => setShowCloseModal(false)} className="text-white/40 hover:text-white/60 text-2xl leading-none">×</button>
              </div>

              {/* 訂單預覽 */}
              <div className="bg-white/5 rounded-2xl px-4 py-3 max-h-52 overflow-y-auto">
                <pre className="text-sm text-white/80 whitespace-pre-wrap font-sans">{orderText}</pre>
              </div>

              <p className="text-sm text-white/50 text-center">結單後成員將無法繼續點餐</p>

              <div className="space-y-2">
                <motion.button
                  onClick={handleCloseAndLine}
                  disabled={orders.length === 0}
                  className="w-full bg-green-500/100 text-white py-3 rounded-2xl font-semibold text-base hover:bg-green-600 disabled:opacity-40 flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.97 }}
                >
                  <span>💬</span> 結單並傳送到 LINE
                </motion.button>
                <motion.button
                  onClick={handleCloseOnly}
                  className="w-full bg-white/5 text-white/80 py-3 rounded-2xl font-semibold text-base hover:bg-white/10"
                  whileTap={{ scale: 0.97 }}
                >
                  僅結單
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <p className="text-red-300 font-medium mb-3">確定要清空此團購單的所有訂單嗎？</p>
            <div className="flex gap-2">
              <button onClick={() => { onReset(session.id); setShowConfirm(false); }} className="flex-1 bg-red-500/100 text-white py-2 rounded-xl font-medium">確定清空</button>
              <button onClick={() => setShowConfirm(false)} className="flex-1 bg-white/5 text-white/80 py-2 rounded-xl font-medium">取消</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 統計 */}
      <div className="glass-card p-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-white/80">共 {orders.length} 杯</span>
          <div className="flex items-center gap-3">
            {!isLeader && myName && (
              <motion.button
                onClick={() => setFilterMine((v) => !v)}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                  filterMine
                    ? 'bg-orange-500/100 border-orange-500 text-white'
                    : 'border-white/15 text-white/50 hover:border-orange-400'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                只看我的（{myName}）
              </motion.button>
            )}
            <span className="text-xl font-bold text-orange-500">NT${total}</span>
          </div>
        </div>
      </div>

      {displayOrders.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="font-semibold text-white/80 mb-3">飲料統計</h3>
          <div className="space-y-1.5">
            {Object.entries(summary).map(([key, count]) => (
              <div key={key} className="flex justify-between text-sm text-white/60">
                <span>{key}</span>
                <span className="font-medium text-orange-500">x{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {displayOrders.length === 0 ? (
        <div className="text-center text-white/40 py-6">
          {filterMine ? `${myName} 尚未點餐` : '目前沒有訂單'}
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {displayOrders.map((order, i) => (
              <motion.div
                key={order.id}
                className="glass-card p-4"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.05 }}
                layout
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-orange-500/100 text-white text-xs font-bold px-2 py-0.5 rounded-full">#{order.serialNo}</span>
                      <span className={`font-semibold ${order.name === myName ? 'text-orange-400' : 'text-white'}`}>
                        {order.name}{order.name === myName && ' ✦'}
                      </span>
                    </div>
                    <div className="text-white/80">{order.drink}（{order.size}）</div>
                    <div className="text-sm text-white/50 mt-0.5">
                      {order.sugar}・{order.ice}
                      {order.note && `・${order.note}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 font-bold">NT${order.price}</span>
                    {!isLeader && order.name === myName && isSessionOpen && (
                      <div className="flex gap-1">
                        {onUpdateOrder && (
                          <motion.button onClick={() => setEditingOrder(order)}
                            className="text-xs text-blue-500 border border-blue-500/20 px-2 py-1 rounded-lg hover:bg-blue-500/100/10 transition-colors"
                            whileTap={{ scale: 0.95 }}
                          >編輯</motion.button>
                        )}
                        <motion.button onClick={() => onRemoveOrder(order.id)}
                          className="text-xs text-red-400 border border-red-500/20 px-2 py-1 rounded-lg hover:bg-red-500/100/10 transition-colors"
                          whileTap={{ scale: 0.95 }}
                        >刪除</motion.button>
                      </div>
                    )}
                    {isLeader && (
                      <motion.button onClick={() => onRemoveOrder(order.id)}
                        className="text-gray-300 hover:text-red-500 text-lg leading-none transition-colors" title="刪除"
                        whileTap={{ scale: 0.8 }}
                      >×</motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* 每人小計（團主專用） */}
      {isLeader && orders.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="font-semibold text-white/80 mb-3">💰 每人小計</h3>
          <div className="space-y-2">
            {Object.entries(
              orders.reduce((acc, o) => { acc[o.name] = (acc[o.name] || 0) + o.price; return acc; }, {})
            ).map(([name, amount]) => (
              <div key={name} className="flex justify-between items-center text-sm">
                <span className="text-white/80 font-medium">{name}</span>
                <span className="font-bold text-orange-500">NT${amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 修改訂單 Modal */}
      <AnimatePresence>
        {editingOrder && (
          <EditOrderModal
            order={editingOrder}
            shop={shop}
            onSave={(data) => onUpdateOrder(editingOrder.id, data)}
            onClose={() => setEditingOrder(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

// ── 歷史紀錄區塊（團主，含收款追蹤）──────────────────────────────
function HistorySection({ pastSessions, getSessionOrders, onRemoveHistory, onMarkPaid }) {
  const [expanded, setExpanded] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  function handleCopy(s) {
    const his = getSessionOrders(s.id);
    navigator.clipboard.writeText(buildCopyText(his, s)).then(() => {
      setCopiedId(s.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  return (
    <div className="glass-card p-4">
      <h3 className="font-semibold text-white/80 mb-3">歷史訂單</h3>
      <div className="space-y-2">
        {pastSessions.map((s) => {
          const his = getSessionOrders(s.id);
          const total = his.reduce((sum, o) => sum + o.price, 0);
          const paidOrders = s.paidOrders || [];
          const paidTotal = his.filter((o) => paidOrders.includes(o.id)).reduce((sum, o) => sum + o.price, 0);
          const isOpen = expanded === s.id;
          const allPaid = his.length > 0 && paidOrders.length >= his.length;
          return (
            <div key={s.id} className="border border-white/10 rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpanded(isOpen ? null : s.id)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{s.shopName}</span>
                    {allPaid && <span className="text-xs bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded-full font-medium">全額收款</span>}
                  </div>
                  <span className="text-xs text-white/40">{s.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm text-white/50">{his.length} 杯 NT${total}</div>
                    {paidTotal > 0 && !allPaid && (
                      <div className="text-xs text-green-400">已收 NT${paidTotal}</div>
                    )}
                  </div>
                  <motion.span className="text-white/40" animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>▼</motion.span>
                </div>
              </div>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t px-3 py-3 bg-white/5 space-y-2">
                      {/* 收款清單 */}
                      <p className="text-xs text-white/40 font-medium mb-1">點擊標記收款狀態</p>
                      {his.map((o) => {
                        const isPaid = paidOrders.includes(o.id);
                        return (
                          <div key={o.id}
                            className={`flex items-center justify-between text-sm rounded-xl px-2 py-1.5 cursor-pointer transition-colors ${isPaid ? 'bg-green-500/10 text-green-300' : 'hover:bg-white/5 text-white/60'}`}
                            onClick={() => onMarkPaid(s.id, o.id, !isPaid)}
                          >
                            <span className="flex items-center gap-2">
                              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isPaid ? 'bg-green-500/100 border-green-500' : 'border-white/15'}`}>
                                {isPaid && <span className="text-white text-xs leading-none">✓</span>}
                              </span>
                              <span>{o.name}・{o.drink}({o.size})</span>
                            </span>
                            <span className={`font-medium ${isPaid ? 'line-through text-green-400' : 'text-orange-500'}`}>NT${o.price}</span>
                          </div>
                        );
                      })}
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => handleCopy(s)} className="flex-1 bg-orange-500/100 text-white py-1.5 rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors">
                          {copiedId === s.id ? '已複製！' : '複製'}
                        </button>
                        <button onClick={() => onRemoveHistory(s.id)} className="px-4 py-1.5 bg-white/10 text-white/60 rounded-xl text-sm hover:bg-red-500/10 hover:text-red-400 transition-colors">
                          刪除
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 使用者自己的歷史 ──────────────────────────────────────────────
function UserHistorySection({ pastSessions, getSessionOrders, myName }) {
  const [expanded, setExpanded] = useState(null);
  const mySessions = pastSessions
    .map((s) => ({ ...s, myOrders: getSessionOrders(s.id).filter((o) => o.name === myName) }))
    .filter((s) => s.myOrders.length > 0);

  if (mySessions.length === 0) return null;

  return (
    <div className="glass-card p-4">
      <h3 className="font-semibold text-white/80 mb-3">📄 我的歷史訂單</h3>
      <div className="space-y-2">
        {mySessions.map((s) => {
          const myTotal = s.myOrders.reduce((sum, o) => sum + o.price, 0);
          const isOpen = expanded === s.id;
          return (
            <div key={s.id} className="border border-white/10 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-white/5" onClick={() => setExpanded(isOpen ? null : s.id)}>
                <div>
                  <span className="font-medium text-white">{s.shopName}</span>
                  <span className="text-xs text-white/40 ml-2">{s.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-orange-500 font-semibold">NT${myTotal}</span>
                  <motion.span className="text-white/40" animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>▼</motion.span>
                </div>
              </div>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="border-t px-3 py-3 bg-white/5 space-y-1.5">
                      {s.myOrders.map((o) => (
                        <div key={o.id} className="flex justify-between text-sm text-white/60">
                          <span>{o.drink}（{o.size}）{o.sugar}・{o.ice}{o.note ? ` ${o.note}` : ''}</span>
                          <span className="text-orange-500 font-medium ml-2">NT${o.price}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 主元件 ───────────────────────────────────────────────────────
export default function OrderSummary({
  activeSessions, getActiveSessionOrders,
  pastSessions, getSessionOrders,
  onRemoveOrder, onUpdateOrder, onCloseSession, onResetSession, onRemoveHistory,
  onMarkPaid, isLeader, getUserName, shops,
}) {
  const myName = getUserName ? getUserName() : '';

  if (activeSessions.length === 0) {
    return (
      <motion.div className="max-w-2xl mx-auto px-4 py-4 space-y-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center text-white/50 py-8">目前沒有進行中的團購單</div>
        {isLeader && pastSessions.length > 0 && (
          <HistorySection pastSessions={pastSessions} getSessionOrders={getSessionOrders} onRemoveHistory={onRemoveHistory} onMarkPaid={onMarkPaid} />
        )}
        {!isLeader && myName && (
          <UserHistorySection pastSessions={pastSessions} getSessionOrders={getSessionOrders} myName={myName} />
        )}
      </motion.div>
    );
  }

  return (
    <motion.div className="max-w-2xl mx-auto px-4 py-4 space-y-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      {!isLeader && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 text-sm text-blue-300 text-center">
          截止前可點「編輯」或「刪除」修改自己的訂單
        </div>
      )}

      {isLeader && activeSessions.length > 0 && (
        <StatsCard orders={activeSessions.flatMap((s) => getActiveSessionOrders(s.id))} />
      )}

      {activeSessions.map((session) => (
        <SessionSummary
          key={session.id}
          session={session}
          shop={shops?.find((s) => s.id === session.shopId)}
          orders={getActiveSessionOrders(session.id)}
          onRemoveOrder={onRemoveOrder}
          onUpdateOrder={onUpdateOrder}
          onClose={onCloseSession}
          onReset={onResetSession}
          isLeader={isLeader}
          myName={myName}
        />
      ))}

      {isLeader && pastSessions.length > 0 && (
        <HistorySection pastSessions={pastSessions} getSessionOrders={getSessionOrders} onRemoveHistory={onRemoveHistory} onMarkPaid={onMarkPaid} />
      )}
      {!isLeader && myName && pastSessions.length > 0 && (
        <UserHistorySection pastSessions={pastSessions} getSessionOrders={getSessionOrders} myName={myName} />
      )}
    </motion.div>
  );
}
