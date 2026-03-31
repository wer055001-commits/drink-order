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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
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
                  className="absolute top-0 h-[3px] w-10 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative">
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Icon
                    className={`w-[22px] h-[22px] mb-0.5 transition-colors ${isActive ? 'text-orange-500' : 'text-gray-400'}`}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </motion.div>
                {item.key === 'summary' && ordersCount > 0 && (role === 'leader' || role === 'admin') && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
                  >
                    {ordersCount > 9 ? '9+' : ordersCount}
                  </motion.span>
                )}
              </div>
              <span className={`text-[11px] font-medium mt-0.5 transition-colors ${isActive ? 'text-orange-500' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
