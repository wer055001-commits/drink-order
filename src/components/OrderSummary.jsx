import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StatsCard from './StatsCard';

function buildCopyText(orders, session) {
  if (!orders.length) return '';
  const shopName = session?.shopName || orders[0]?.shopName || '';
  const date = session?.date || '';
  let text = `【${shopName} ${date} 團購訂單】\n\n`;
  orders.forEach((o) => {
    text += `#${o.serialNo} ${o.name}：${o.drink}(${o.size}) ${o.sugar} ${o.ice}`;
    if (o.toppings.length) text += ` +${o.toppings.join('+')}`;
    if (o.note) text += ` (${o.note})`;
    text += ` NT$${o.price}\n`;
  });
  const t = orders.reduce((s, o) => s + o.price, 0);
  text += `\n共 ${orders.length} 杯，合計 NT$${t}`;
  return text;
}

// ── 單一 session 的訂單區塊 ───────────────────────────────────────
function SessionSummary({ session, orders, onRemoveOrder, onClose, onReset, isLeader, myName }) {
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [filterMine, setFilterMine] = useState(!isLeader);

  const displayOrders = filterMine && myName ? orders.filter((o) => o.name === myName) : orders;
  const total = displayOrders.reduce((sum, o) => sum + o.price, 0);
  const summary = displayOrders.reduce((acc, o) => {
    const key = `${o.drink}(${o.size}) ${o.sugar} ${o.ice}${o.toppings.length ? ' +' + o.toppings.join('+') : ''}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  function handleCopy() {
    navigator.clipboard.writeText(buildCopyText(orders, session)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-3">
      {/* Session 標題列 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-700 text-lg">{session.shopName}</h2>
          <p className="text-xs text-gray-400">{session.date}</p>
        </div>
        {isLeader && (
          <div className="flex gap-2 flex-wrap justify-end">
            <motion.button onClick={handleCopy} disabled={orders.length === 0}
              className="text-sm bg-orange-500 text-white px-3 py-1.5 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-40"
              whileTap={{ scale: 0.95 }}
            >{copied ? '已複製！' : '複製'}</motion.button>
            <motion.button onClick={() => onClose(session.id)}
              className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-xl font-medium hover:bg-gray-200"
              whileTap={{ scale: 0.95 }}
            >關閉</motion.button>
            <motion.button onClick={() => setShowConfirm(true)}
              className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-xl font-medium hover:bg-gray-200"
              whileTap={{ scale: 0.95 }}
            >重置</motion.button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="bg-red-50 border border-red-200 rounded-2xl p-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <p className="text-red-700 font-medium mb-3">確定要清空此團購單的所有訂單嗎？</p>
            <div className="flex gap-2">
              <button onClick={() => { onReset(session.id); setShowConfirm(false); }} className="flex-1 bg-red-500 text-white py-2 rounded-xl font-medium">確定清空</button>
              <button onClick={() => setShowConfirm(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl font-medium">取消</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 統計 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700">共 {orders.length} 杯</span>
          <div className="flex items-center gap-3">
            {!isLeader && myName && (
              <motion.button
                onClick={() => setFilterMine((v) => !v)}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                  filterMine
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'border-gray-300 text-gray-500 hover:border-orange-400'
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-700 mb-3">飲料統計</h3>
          <div className="space-y-1.5">
            {Object.entries(summary).map(([key, count]) => (
              <div key={key} className="flex justify-between text-sm text-gray-600">
                <span>{key}</span>
                <span className="font-medium text-orange-500">x{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {displayOrders.length === 0 ? (
        <div className="text-center text-gray-400 py-6">
          {filterMine ? `${myName} 尚未點餐` : '目前沒有訂單'}
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {displayOrders.map((order, i) => (
              <motion.div
                key={order.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.05 }}
                layout
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">#{order.serialNo}</span>
                      <span className={`font-semibold ${order.name === myName ? 'text-orange-600' : 'text-gray-800'}`}>
                        {order.name}{order.name === myName && ' ✦'}
                      </span>
                    </div>
                    <div className="text-gray-700">{order.drink}（{order.size}）</div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {order.sugar}・{order.ice}
                      {order.toppings.length > 0 && `・+${order.toppings.join('、')}`}
                      {order.note && `・${order.note}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-orange-500 font-bold">NT${order.price}</span>
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

      {/* 複製預覽（折疊） */}
      {orders.length > 0 && isLeader && (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="w-full flex justify-between items-center px-4 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <span>複製預覽</span>
            <motion.span animate={{ rotate: showPreview ? 180 : 0 }} transition={{ duration: 0.2 }}>▼</motion.span>
          </button>
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 border-t">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono pt-3">{buildCopyText(orders, session)}</pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── 歷史紀錄區塊 ─────────────────────────────────────────────────
function HistorySection({ pastSessions, getSessionOrders, onRemoveHistory }) {
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <h3 className="font-semibold text-gray-700 mb-3">歷史訂單</h3>
      <div className="space-y-2">
        {pastSessions.map((s) => {
          const his = getSessionOrders(s.id);
          const total = his.reduce((sum, o) => sum + o.price, 0);
          const isOpen = expanded === s.id;
          return (
            <div key={s.id} className="border border-gray-100 rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(isOpen ? null : s.id)}
              >
                <div>
                  <span className="font-medium text-gray-800">{s.shopName}</span>
                  <span className="text-sm text-gray-500 ml-2">{s.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{his.length} 杯 NT${total}</span>
                  <motion.span
                    className="text-gray-400"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >▼</motion.span>
                </div>
              </div>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t px-3 py-3 bg-gray-50 space-y-2">
                      {his.map((o) => (
                        <div key={o.id} className="flex justify-between text-sm text-gray-600">
                          <span>#{o.serialNo} {o.name}・{o.drink}({o.size}) {o.sugar} {o.ice}{o.toppings.length ? ` +${o.toppings.join('+')}` : ''}</span>
                          <span className="text-orange-500 font-medium ml-2">NT${o.price}</span>
                        </div>
                      ))}
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => handleCopy(s)} className="flex-1 bg-orange-500 text-white py-1.5 rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors">
                          {copiedId === s.id ? '已複製！' : '複製'}
                        </button>
                        <button onClick={() => onRemoveHistory(s.id)} className="px-4 py-1.5 bg-gray-200 text-gray-600 rounded-xl text-sm hover:bg-red-100 hover:text-red-600 transition-colors">
                          刪除紀錄
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

// ── 主元件 ───────────────────────────────────────────────────────
export default function OrderSummary({
  activeSessions, getActiveSessionOrders,
  pastSessions, getSessionOrders,
  onRemoveOrder, onCloseSession, onResetSession, onRemoveHistory,
  isLeader, getUserName,
}) {
  const myName = getUserName ? getUserName() : '';

  if (activeSessions.length === 0) {
    return (
      <motion.div
        className="max-w-2xl mx-auto px-4 py-4 space-y-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center text-gray-500 py-8">目前沒有進行中的團購單</div>
        {isLeader && pastSessions.length > 0 && (
          <HistorySection pastSessions={pastSessions} getSessionOrders={getSessionOrders} onRemoveHistory={onRemoveHistory} />
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="max-w-2xl mx-auto px-4 py-4 space-y-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {!isLeader && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-sm text-blue-700 text-center">
          目前為唯讀模式，僅可查看訂單
        </div>
      )}

      {/* 全局統計卡（所有進行中訂單） */}
      {isLeader && activeSessions.length > 0 && (
        <StatsCard orders={activeSessions.flatMap((s) => getActiveSessionOrders(s.id))} />
      )}

      {activeSessions.map((session) => (
        <SessionSummary
          key={session.id}
          session={session}
          orders={getActiveSessionOrders(session.id)}
          onRemoveOrder={onRemoveOrder}
          onClose={onCloseSession}
          onReset={onResetSession}
          isLeader={isLeader}
          myName={myName}
        />
      ))}

      {isLeader && pastSessions.length > 0 && (
        <HistorySection pastSessions={pastSessions} getSessionOrders={getSessionOrders} onRemoveHistory={onRemoveHistory} />
      )}
    </motion.div>
  );
}
