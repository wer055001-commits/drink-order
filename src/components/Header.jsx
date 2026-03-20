import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ROLE_LABELS = { admin: '管理者', leader: '團主', user: '使用者' };
const ROLE_COLORS = { admin: 'bg-red-200 text-red-800', leader: 'bg-orange-200 text-orange-800', user: 'bg-blue-200 text-blue-800' };

const SWITCH_OPTIONS = [
  { key: 'leader', icon: '📋', label: '團主', color: 'text-orange-500' },
  { key: 'user',   icon: '🧋', label: '使用者', color: 'text-blue-500' },
];

export default function Header({ activeSessions, ordersCount, role, onLogout, onSwitchRole }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.span
              className="text-2xl"
              animate={{ rotate: [0, -15, 15, 0] }}
              transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.5 }}
            >
              🧋
            </motion.span>
            <div>
              <h1 className="text-lg font-bold tracking-wide leading-tight">麻將飲料團</h1>
              {activeSessions.length > 0 && (
                <p className="text-xs text-white/70">{activeSessions.length} 個團購進行中・{ordersCount} 筆訂單</p>
              )}
            </div>
          </div>

          <div className="relative">
            <motion.button
              onClick={() => setShowMenu((v) => !v)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full ${ROLE_COLORS[role] || 'bg-white text-orange-700'}`}
              whileTap={{ scale: 0.95 }}
            >
              {ROLE_LABELS[role] || ''} ↓
            </motion.button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  className="absolute right-0 top-9 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 w-40"
                  initial={{ opacity: 0, scale: 0.9, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <p className="text-xs text-gray-400 px-3 pb-2">切換身分</p>
                  {SWITCH_OPTIONS.filter((o) => o.key !== role).map((o) => (
                    <button
                      key={o.key}
                      onClick={() => { onSwitchRole(o.key); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                    >
                      <span>{o.icon}</span>
                      <span className={`text-sm font-medium ${o.color}`}>{o.label}</span>
                    </button>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => { onLogout(); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 transition-colors text-left"
                    >
                      <span>🚪</span>
                      <span className="text-sm font-medium text-red-500">登出</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
