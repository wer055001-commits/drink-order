import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

export default function StatsCard({ orders }) {
  if (!orders.length) return null;

  const drinkCount = orders.reduce((acc, o) => {
    acc[o.drink] = (acc[o.drink] || 0) + 1;
    return acc;
  }, {});
  const topDrinks = Object.entries(drinkCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const personCount = orders.reduce((acc, o) => {
    acc[o.name] = (acc[o.name] || 0) + 1;
    return acc;
  }, {});
  const topPerson = Object.entries(personCount).sort((a, b) => b[1] - a[1])[0];

  const total = orders.reduce((s, o) => s + o.price, 0);
  const maxCount = topDrinks[0]?.[1] || 1;

  return (
    <motion.div
      className="glass-card p-4 space-y-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(249,115,22,0.1)' }}>
          <div className="text-2xl font-bold text-orange-500">{orders.length}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>總杯數</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
          <div className="text-2xl font-bold text-amber-500">NT${total}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>合計金額</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
          <div className="text-lg font-bold text-red-400 truncate">{topPerson?.[0] || '-'}</div>
          <div className="text-xs mt-0.5 flex items-center justify-center gap-1" style={{ color: 'var(--text-muted)' }}>
            點最多 <Trophy className="w-3 h-3 text-amber-400" />
          </div>
        </div>
      </div>

      {topDrinks.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>熱門飲料</h4>
          <div className="space-y-2">
            {topDrinks.map(([drink, count], i) => (
              <div key={drink} className="flex items-center gap-2">
                <span className="text-xs w-4" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                <span className="text-sm w-24 truncate" style={{ color: 'var(--text-secondary)' }}>{drink}</span>
                <div className="flex-1 rounded-full h-2 overflow-hidden" style={{ background: 'var(--surface)' }}>
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
