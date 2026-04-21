import { motion } from 'framer-motion';
import { User } from 'lucide-react';

export default function ProfilePage({ getUserName, pastSessions, getSessionOrders }) {
  const myName = getUserName ? getUserName() : '';

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
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <User className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
        </div>
        <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>請先點一杯飲料</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>點餐後才會記錄個人資料</p>
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
      <div className="rounded-2xl p-6 text-white" style={{ background: 'var(--gradient-solid)', boxShadow: '0 4px 20px rgba(var(--accent-rgb),0.25)' }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
            {myName.slice(0, 1)}
          </div>
          <div>
            <h2 className="text-xl font-bold">{myName}</h2>
            <p className="text-white/70 text-sm">使用者</p>
          </div>
        </div>
      </div>

      {/* 統計數字 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">{myOrders.length}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>歷史杯數</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-amber-500">NT${totalSpent}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>累計消費</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-sm font-bold text-red-400 truncate">{favDrink?.[0] || '-'}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>最愛飲料</div>
        </div>
      </div>

      {/* 歷史點單 */}
      {myOrders.length > 0 ? (
        <div className="glass-card p-4">
          <h3 className="font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>點餐紀錄</h3>
          <div className="space-y-2">
            {myOrders.slice().reverse().map((o, i) => (
              <motion.div
                key={o.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
                style={{ borderColor: 'var(--border)' }}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{o.drink}（{o.size}）</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{o.shopName}・{o.sessionDate}</div>
                </div>
                <span className="text-orange-500 font-semibold text-sm">NT${o.price}</span>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>尚無歷史紀錄</div>
      )}
    </motion.div>
  );
}
