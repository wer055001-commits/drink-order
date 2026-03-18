import { motion } from 'framer-motion';

const NAV_ITEMS = {
  admin: [
    { key: 'order', icon: '🧋', label: '點餐' },
    { key: 'summary', icon: '📋', label: '訂單總覽' },
    { key: 'menu', icon: '🔧', label: '菜單管理' },
    { key: 'profile', icon: '👤', label: '個人' },
  ],
  leader: [
    { key: 'order', icon: '🧋', label: '點餐' },
    { key: 'summary', icon: '📋', label: '訂單總覽' },
    { key: 'profile', icon: '👤', label: '個人' },
  ],
  user: [
    { key: 'order', icon: '🧋', label: '點餐' },
    { key: 'summary', icon: '📄', label: '本次訂單' },
    { key: 'profile', icon: '👤', label: '個人' },
  ],
};

export default function BottomNav({ activeTab, onTabChange, ordersCount, role }) {
  const items = NAV_ITEMS[role] || NAV_ITEMS.user;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-lg z-40">
      <div className="max-w-2xl mx-auto flex">
        {items.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className="flex-1 flex flex-col items-center py-2 relative"
            >
              {isActive && (
                <motion.div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-orange-500 rounded-full"
                  layoutId="bottomNavIndicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <motion.span
                className="text-2xl mb-0.5"
                animate={{ scale: isActive ? 1.15 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {item.icon}
              </motion.span>
              <span className={`text-xs font-medium ${isActive ? 'text-orange-500' : 'text-gray-400'}`}>
                {item.label}
              </span>
              {item.key === 'summary' && ordersCount > 0 && (
                <motion.span
                  className="absolute top-1 right-[calc(50%-20px)] bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  {ordersCount > 9 ? '9+' : ordersCount}
                </motion.span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
