import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VISIBLE_ROLES = [
  {
    key: 'leader',
    icon: '📋',
    title: '團主',
    desc: '可開啟點餐、查看所有訂單、複製匯總',
    border: 'border-orange-400',
    bg: 'hover:bg-orange-50',
    accent: 'text-orange-500',
  },
  {
    key: 'user',
    icon: '🧋',
    title: '使用者',
    desc: '點飲料、查看本次訂單',
    border: 'border-blue-400',
    bg: 'hover:bg-blue-50',
    accent: 'text-blue-500',
  },
];

export default function RoleSelect({ onSelect }) {
  const [remember, setRemember] = useState(false);
  const [logoTaps, setLogoTaps] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);

  function handleLogoTap() {
    const next = logoTaps + 1;
    setLogoTaps(next);
    if (next >= 5) {
      onSelect('admin', remember);
      setLogoTaps(0);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="text-6xl mb-3 cursor-pointer select-none inline-block"
            animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
            transition={{ delay: 0.3, duration: 0.6 }}
            onClick={handleLogoTap}
          >
            🧋
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-800">麻將飲料團</h1>
          <p className="text-gray-500 mt-1">請選擇你的身分</p>
        </motion.div>

        <div className="space-y-3">
          {VISIBLE_ROLES.map((r, i) => (
            <motion.button
              key={r.key}
              onClick={() => onSelect(r.key, remember)}
              className={`w-full bg-white rounded-2xl border-2 ${r.border} ${r.bg} p-4 text-left shadow-sm`}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{r.icon}</span>
                <div className="flex-1">
                  <div className={`font-bold ${r.accent}`}>{r.title}</div>
                  <p className="text-sm text-gray-500 mt-0.5">{r.desc}</p>
                </div>
                <span className="text-gray-300 text-lg">›</span>
              </div>
            </motion.button>
          ))}

          <AnimatePresence>
            {showAdmin && (
              <motion.button
                onClick={() => onSelect('admin', remember)}
                className="w-full bg-white rounded-2xl border-2 border-red-400 hover:bg-red-50 p-4 text-left shadow-sm"
                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🔧</span>
                  <div className="flex-1">
                    <div className="font-bold text-red-500">管理者</div>
                    <p className="text-sm text-gray-500 mt-0.5">可管理菜單、店家設定，擁有所有功能</p>
                  </div>
                  <span className="text-gray-300 text-lg">›</span>
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <motion.label
          className="flex items-center justify-center gap-2 mt-6 cursor-pointer select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 accent-orange-500"
          />
          <span className="text-sm text-gray-500">記住我（下次自動登入）</span>
        </motion.label>
      </div>
    </div>
  );
}
