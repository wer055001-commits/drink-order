import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCountdown } from '../hooks/useCountdown';

const DURATION_OPTIONS = [15, 20, 30, 45, 60];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── 個別團購單卡片（清單用）─────────────────────────────────────
function SessionCard({ session, sessionOrders, onOrder, onExtend, onClose, onReset, onContinue, isLeader }) {
  const { isExpired, display, secondsLeft } = useCountdown(session.expiresAt);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const isStale = session.date !== todayStr();
  const canOrder = !isExpired && !isStale;
  const timeColor = isExpired
    ? 'text-red-600'
    : secondsLeft <= 120
    ? 'text-red-500'
    : secondsLeft <= 300
    ? 'text-amber-500'
    : 'text-green-600';

  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3 ${isExpired ? 'opacity-70' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-bold text-gray-800 text-lg">{session.shopName}</div>
          <div className="text-sm text-gray-400">{session.date}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 mb-0.5">剩餘時間</div>
          <div className={`font-bold ${timeColor}`}>{isExpired ? '已截止' : display}</div>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        目前 <span className="font-semibold text-gray-700">{sessionOrders.length}</span> 筆訂單
      </div>

      {isStale && isLeader && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-sm text-amber-700 font-medium mb-2">此為昨日或更早的團購單</p>
          <div className="flex gap-2">
            <button onClick={() => onContinue(session.id)} className="flex-1 text-sm bg-amber-500 text-white py-1.5 rounded-xl font-medium hover:bg-amber-600 transition-colors">繼續此單</button>
            <button onClick={() => setConfirmReset(true)} className="flex-1 text-sm bg-gray-100 text-gray-600 py-1.5 rounded-xl font-medium hover:bg-gray-200 transition-colors">刪除</button>
          </div>
        </div>
      )}

      {isLeader && !isStale && (
        <div className="flex gap-2 flex-wrap">
          {!isExpired && (
            <motion.button onClick={() => onExtend(session.id, 15)} className="text-xs border border-blue-300 text-blue-500 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors" whileTap={{ scale: 0.95 }}>+15 分鐘</motion.button>
          )}
          <motion.button onClick={() => setConfirmClose(true)} className="text-xs border border-gray-300 text-gray-500 px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors" whileTap={{ scale: 0.95 }}>關閉</motion.button>
          <motion.button onClick={() => setConfirmReset(true)} className="text-xs border border-red-200 text-red-400 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors" whileTap={{ scale: 0.95 }}>重置</motion.button>
        </div>
      )}

      {!isLeader && (
        canOrder ? (
          <motion.button
            onClick={() => onOrder(session.id)}
            className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            我要點餐 →
          </motion.button>
        ) : isStale ? (
          <div className="text-center text-sm text-gray-400 py-2">此團購單已過期（跨日）</div>
        ) : (
          <div className="text-center text-sm text-red-400 py-2">⏰ 點餐時間已截止，請聯絡團主延長</div>
        )
      )}

      <AnimatePresence>
        {confirmClose && (
          <motion.div
            className="bg-gray-50 border rounded-xl p-3 space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <p className="text-sm font-medium text-gray-700">關閉此團購單？（{sessionOrders.length} 筆訂單將保留在歷史紀錄）</p>
            <div className="flex gap-2">
              <button onClick={() => { onClose(session.id); setConfirmClose(false); }} className="flex-1 text-sm bg-orange-500 text-white py-1.5 rounded-xl font-medium">確定關閉</button>
              <button onClick={() => setConfirmClose(false)} className="flex-1 text-sm bg-gray-100 text-gray-600 py-1.5 rounded-xl font-medium">取消</button>
            </div>
          </motion.div>
        )}

        {confirmReset && (
          <motion.div
            className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <p className="text-sm font-medium text-red-700">重置此團購單？所有 {sessionOrders.length} 筆訂單將被刪除。</p>
            <div className="flex gap-2">
              <button onClick={() => { onReset(session.id); setConfirmReset(false); }} className="flex-1 text-sm bg-red-500 text-white py-1.5 rounded-xl font-medium">確定刪除</button>
              <button onClick={() => setConfirmReset(false)} className="flex-1 text-sm bg-gray-100 text-gray-600 py-1.5 rounded-xl font-medium">取消</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── 建立新團購單表單（團主/管理者）──────────────────────────────
function CreateSessionForm({ shops, onStartSession, onBack }) {
  const [selectedShopId, setSelectedShopId] = useState(shops[0]?.id || '');
  const [duration, setDuration] = useState(30);

  const selectedShop = shops.find((s) => s.id === selectedShopId);

  function handleCreate() {
    if (!selectedShopId) return;
    onStartSession(selectedShopId, duration);
    onBack();
  }

  return (
    <motion.div
      className="max-w-2xl mx-auto px-4 py-8"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25 }}
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-gray-500 hover:text-orange-500 transition-colors">← 返回</button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <h2 className="text-lg font-bold text-gray-700">建立新的團購單</h2>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">選擇飲料店</label>
          <select
            className="w-full border border-gray-200 rounded-xl p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
          >
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}（{s.menu.length} 個品項）
              </option>
            ))}
          </select>
          {selectedShop && selectedShop.menu.length === 0 && (
            <p className="text-xs text-amber-600 mt-1.5">⚠️ 此店家尚無品項，建議先至「菜單管理」新增後再建立</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">開放點餐時間</label>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((d) => (
              <motion.button key={d} type="button" onClick={() => setDuration(d)}
                className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-colors ${duration === d ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-600 hover:border-orange-300'}`}
                whileTap={{ scale: 0.95 }}
              >{d} 分鐘</motion.button>
            ))}
            <div className="flex items-center gap-1">
              <input type="number" min="1" max="10080" placeholder="自訂"
                className="w-16 border border-gray-200 rounded-xl p-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-300"
                onChange={(e) => { const v = parseInt(e.target.value, 10); if (v > 0) setDuration(v); }}
              />
              <span className="text-sm text-gray-500">分鐘</span>
            </div>
          </div>
        </div>

        <motion.button
          onClick={handleCreate}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          建立團購單（限時 {duration} 分鐘）
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── 點餐表單──────────────────────────────────────────────────────
function OrderFormContent({ session, shop, onAddOrder, onBack }) {
  const { isExpired, display, secondsLeft } = useCountdown(session.expiresAt);
  const [name, setName] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [size, setSize] = useState('');
  const [sugar, setSugar] = useState('全糖');
  const [ice, setIce] = useState('正常冰');
  const [toppings, setToppings] = useState([]);
  const [note, setNote] = useState('');

  function handleItemSelect(item) {
    setSelectedItem(item);
    setSize(item.sizes[0]?.label || '');
    setToppings([]);
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
      toppings,
      price: calcPrice(),
      note: note.trim(),
    });
  }

  const timeColor = isExpired ? 'text-red-600' : secondsLeft <= 120 ? 'text-red-500' : secondsLeft <= 300 ? 'text-amber-500' : 'text-green-600';

  const orderSummary = selectedItem
    ? `${selectedItem.name}（${size}）・${sugar}・${ice}${toppings.length ? '・+' + toppings.join('、') : ''}${note ? '・' + note : ''}`
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
        <button type="button" onClick={onBack} className="text-sm text-gray-500 hover:text-orange-500 transition-colors">← 返回列表</button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{shop.name}</span>
          <span className={`font-bold ${timeColor}`}>{isExpired ? '已截止' : display}</span>
        </div>
      </div>

      <AnimatePresence>
        {!isExpired && secondsLeft <= 120 && (
          <motion.div
            className="bg-red-50 border border-red-300 rounded-2xl px-4 py-2.5 mb-3 flex items-center gap-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <span className="text-lg">⚠️</span>
            <p className="text-sm font-semibold text-red-700">點餐即將截止！剩餘 {display}，請盡快送出</p>
          </motion.div>
        )}
      </AnimatePresence>

      {isExpired ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-2">
          <p className="text-2xl">⏰</p>
          <p className="text-red-700 font-bold text-lg">點餐時間已截止</p>
          <p className="text-red-600 text-sm">請聯絡團主延長時間</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <label className="block text-sm font-semibold text-gray-600 mb-2">你的姓名</label>
            <input type="text" placeholder="請輸入姓名" value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300" required
            />
          </motion.div>

          <motion.div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <label className="block text-sm font-semibold text-gray-600 mb-2">選擇飲料</label>
            {shop.menu.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">此店家尚無品項，請先至「菜單管理」新增飲料。</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {shop.menu.map((item) => (
                  <motion.button type="button" key={item.id} onClick={() => handleItemSelect(item)}
                    className={`p-3 rounded-xl border-2 text-left transition-colors ${selectedItem?.id === item.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="font-medium text-gray-800">{item.name}</div>
                    <div className="text-sm text-orange-500">NT${item.price}起</div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          <AnimatePresence>
            {selectedItem && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {selectedItem.sizes.length > 1 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <label className="block text-sm font-semibold text-gray-600 mb-2">尺寸</label>
                    <div className="flex gap-2">
                      {selectedItem.sizes.map((s) => (
                        <motion.button type="button" key={s.label} onClick={() => setSize(s.label)}
                          className={`flex-1 py-2 rounded-xl border-2 font-medium transition-colors ${size === s.label ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-600 hover:border-orange-300'}`}
                          whileTap={{ scale: 0.97 }}
                        >{s.label} {s.add > 0 ? `+${s.add}` : ''}</motion.button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">甜度</label>
                  <div className="flex flex-wrap gap-2">
                    {shop.options.sugar.map((s) => (
                      <motion.button type="button" key={s} onClick={() => setSugar(s)}
                        className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${sugar === s ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-300 text-gray-600 hover:border-orange-400'}`}
                        whileTap={{ scale: 0.95 }}
                      >{s}</motion.button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">冰塊</label>
                  <div className="flex flex-wrap gap-2">
                    {shop.options.ice.map((ic) => (
                      <motion.button type="button" key={ic} onClick={() => setIce(ic)}
                        className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${ice === ic ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 text-gray-600 hover:border-blue-400'}`}
                        whileTap={{ scale: 0.95 }}
                      >{ic}</motion.button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">加料（可多選）</label>
                  <div className="flex flex-wrap gap-2">
                    {shop.options.toppings.map((t) => (
                      <motion.button type="button" key={t} onClick={() => toggleTopping(t)}
                        className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${toppings.includes(t) ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 text-gray-600 hover:border-green-400'}`}
                        whileTap={{ scale: 0.95 }}
                      >{t}</motion.button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">備註（選填）</label>
                  <input type="text" placeholder="其他特殊需求..." value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
                  <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-sm text-orange-800">
                    <span className="font-semibold">確認：</span>{orderSummary}
                    <span className="font-bold ml-2 text-orange-600">NT${calcPrice()}</span>
                  </div>
                  <motion.button
                    type="submit"
                    className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
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
  onStartSession, onAddOrder,
  onCloseSession, onResetSession, onContinueSession, onExtendSession,
  getActiveSessionOrders, isLeader, onSaveUserName,
}) {
  const [view, setView] = useState('list');
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [submittedFor, setSubmittedFor] = useState(null);

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
        onAddOrder={(orderData) => {
          onAddOrder(orderData, selectedSessionId);
          if (onSaveUserName) onSaveUserName(orderData.name);
          setSubmittedFor(selectedSessionId);
          setTimeout(() => setSubmittedFor(null), 3000);
          setView('list');
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
            className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <p className="text-green-700 font-bold text-lg">✅ 訂單已送出！</p>
            <p className="text-green-600 text-sm mt-1">下一位可以開始點了</p>
          </motion.div>
        )}
      </AnimatePresence>

      {activeSessions.length === 0 ? (
        isLeader ? (
          <div className="text-center py-8 text-gray-500">
            <motion.div
              className="text-5xl mb-4"
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >📋</motion.div>
            <p className="font-medium">尚無進行中的團購單</p>
            <p className="text-sm mt-1 text-gray-400">點擊下方按鈕建立</p>
          </div>
        ) : (
          <div className="text-center py-16">
            <motion.div
              className="text-6xl mb-4"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >🧋</motion.div>
            <p className="text-gray-600 font-medium text-lg">等待團主建立團購單</p>
            <p className="text-gray-400 text-sm mt-2">請稍後，團主尚未開始本次點餐</p>
          </div>
        )
      ) : (
        sortedSessions.map((s) => (
          <SessionCard
            key={s.id}
            session={s}
            sessionOrders={getActiveSessionOrders(s.id)}
            onOrder={(id) => { setSelectedSessionId(id); setView('order'); }}
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
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          ＋ 新增團購單
        </motion.button>
      )}
    </motion.div>
  );
}
