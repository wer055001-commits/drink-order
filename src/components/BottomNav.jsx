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
    <nav
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.04), 0 -1px 0 rgba(0,0,0,0.03)',
      }}
    >
      <div className="max-w-2xl mx-auto flex">
        {items.map((item) => {
          const isActive = activeTab === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className="flex-1 flex flex-col items-center py-2 pt-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] relative cursor-pointer"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 h-[3px] w-10 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #fb923c, #f97316)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative">
                <motion.div
                  animate={isActive ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  {isActive ? (
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #fb923c, #f97316)',
                        boxShadow: '3px 3px 8px rgba(249,115,22,0.25)',
                      }}
                    >
                      <Icon className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
                    </div>
                  ) : (
                    <Icon className="w-[22px] h-[22px] text-gray-400" strokeWidth={1.8} />
                  )}
                </motion.div>
                {item.key === 'summary' && ordersCount > 0 && (role === 'leader' || role === 'admin') && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
                  >
                    {ordersCount > 9 ? '9+' : ordersCount}
                  </motion.span>
                )}
              </div>
              <span className={`text-[10px] font-semibold mt-1 transition-colors ${isActive ? 'text-orange-500' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
