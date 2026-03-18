import { motion } from 'framer-motion';

export default function ProfilePage({ getUserName, pastSessions, getSessionOrders }) {
  const myName = getUserName ? getUserName() : '';

  // 找出所有歷史訂單中屬於我的
  const myOrders = pastSessions.flatMap((s) =>
    getSessionOrders(s.id).filter((o) => o.name === myName).map((o) => ({ ...o, sessionDate: s.date, shopName: s.shopName }))
  );

  const totalSpent = myOrders.reduce((s, o) => s + o.price, 0);

  const drinkCount = myOrders.reduce((acc, o) => {
    acc[o.drink] = (acc[o.drink] || 0) + 1;
    return acc;
  }, {});
  const favDrink = Object.entries(drinkCount).sort((a, b) => b[1] - a[1])[0];

  if (!myName) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-4">👤</div>
        <p className="text-gray-500 font-medium">請先點一杯飲料</p>
        <p className="text-gray-400 text-sm mt-1">點餐後才會記錄個人資料</p>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-2xl mx-auto px-4 py-4 space-y-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* 個人資訊卡 */}
      <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
            {myName.slice(0, 1)}
          </div>
          <div>
            <h2 className="text-xl font-bold">{myName}</h2>
            <p className="text-white/80 text-sm">使用者</p>
          </div>
        </div>
      </div>

      {/* 統計數字 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">{myOrders.length}</div>
          <div className="text-xs text-gray-500 mt-1">歷史杯數</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-amber-500">NT${totalSpent}</div>
          <div className="text-xs text-gray-500 mt-1">累計消費</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <div className="text-sm font-bold text-red-400 truncate">{favDrink?.[0] || '-'}</div>
          <div className="text-xs text-gray-500 mt-1">最愛飲料</div>
        </div>
      </div>

      {/* 歷史點單 */}
      {myOrders.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-700 mb-3">點餐紀錄</h3>
          <div className="space-y-2">
            {myOrders.slice().reverse().map((o, i) => (
              <motion.div
                key={o.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div>
                  <div className="text-sm font-medium text-gray-800">{o.drink}（{o.size}）</div>
                  <div className="text-xs text-gray-400">{o.shopName}・{o.sessionDate}</div>
                </div>
                <span className="text-orange-500 font-semibold text-sm">NT${o.price}</span>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 py-8">尚無歷史紀錄</div>
      )}
    </motion.div>
  );
}
