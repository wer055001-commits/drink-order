import { motion } from 'framer-motion';
import { Coffee, ClipboardList, Settings, User, FileText } from 'lucide-react';

const NAV_ITEMS = {
  admin: [
    { key: 'order', icon: Coffee, label: '點餐' },
    { key: 'summary', icon: ClipboardList, label: '訂單' },
    { key: 'menu', icon: Settings, label: '管理' },
    { key: 'profile', icon: User, label: '帳戶' },
  ],
  leader: [
    { key: 'order', icon: Coffee, label: '點餐' },
    { key: 'summary', icon: ClipboardList, label: '訂單' },
    { key: 'profile', icon: User, label: '帳戶' },
  ],
  user: [
    { key: 'order', icon: Coffee, label: '點餐' },
    { key: 'summary', icon: FileText, label: '我的訂單' },
    { key: 'profile', icon: User, label: '帳戶' },
  ],
};

export default function BottomNav({ activeTab, onTabChange, ordersCount, role }) {
  const items = NAV_ITEMS[role] || NAV_ITEMS.user;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <nav
        className="max-w-md mx-auto flex rounded-2xl overflow-hidden"
        style={{
          background: 'var(--nav-bg)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}
      >
        {items.map((item) => {
          const isActive = activeTab === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className="flex-1 flex flex-col items-center py-3 relative cursor-pointer"
            >
              <div className="relative">
                <motion.div animate={isActive ? { scale: 1.15 } : { scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                  {isActive ? (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'var(--gradient-solid)', boxShadow: '0 4px 16px rgba(var(--accent-rgb), 0.35)' }}
                    >
                      <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center">
                      <Icon className="w-5 h-5" style={{ color: 'var(--text-muted)' }} strokeWidth={1.8} />
                    </div>
                  )}
                </motion.div>
                {item.key === 'summary' && ordersCount > 0 && (role === 'leader' || role === 'admin') && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full text-[10px] font-bold text-white"
                    style={{ background: 'var(--gradient-solid)' }}
                  >{ordersCount > 9 ? '9+' : ordersCount}</motion.span>
                )}
              </div>
              <span className="text-[10px] font-semibold mt-1 transition-colors" style={{ color: isActive ? 'var(--text)' : 'var(--text-muted)' }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
