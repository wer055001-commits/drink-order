import { motion } from 'framer-motion';

export default function StatsCard({ orders }) {
  if (!orders.length) return null;

  // 最熱門飲料
  const drinkCount = orders.reduce((acc, o) => {
    acc[o.drink] = (acc[o.drink] || 0) + 1;
    return acc;
  }, {});
  const topDrinks = Object.entries(drinkCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // 誰點最多
  const personCount = orders.reduce((acc, o) => {
    acc[o.name] = (acc[o.name] || 0) + 1;
    return acc;
  }, {});
  const topPerson = Object.entries(personCount).sort((a, b) => b[1] - a[1])[0];

  // 總金額
  const total = orders.reduce((s, o) => s + o.price, 0);

  const maxCount = topDrinks[0]?.[1] || 1;

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* 數字摘要 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-orange-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-orange-500">{orders.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">總杯數</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-amber-500">NT${total}</div>
          <div className="text-xs text-gray-500 mt-0.5">合計金額</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-red-400 truncate">{topPerson?.[0] || '-'}</div>
          <div className="text-xs text-gray-500 mt-0.5">點最多 🏆</div>
        </div>
      </div>

      {/* 熱門飲料長條圖 */}
      {topDrinks.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">熱門飲料</h4>
          <div className="space-y-2">
            {topDrinks.map(([drink, count], i) => (
              <div key={drink} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                <span className="text-sm text-gray-700 w-24 truncate">{drink}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-orange-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxCount) * 100}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                  />
                </div>
                <span className="text-xs font-semibold text-orange-500 w-8 text-right">x{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
