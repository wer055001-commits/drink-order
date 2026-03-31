import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, ClipboardList, User, ChevronDown, LogOut } from 'lucide-react';

const ROLE_LABELS = { admin: '管理者', leader: '團主', user: '使用者' };

const SWITCH_OPTIONS = [
  { key: 'leader', icon: ClipboardList, label: '團主' },
  { key: 'user', icon: User, label: '使用者' },
];

export default function Header({ activeSessions, ordersCount, role, onLogout, onSwitchRole, siteTitle }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  return (
    <header
      className="text-white"
      style={{
        background: 'linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)',
        boxShadow: '0 8px 32px rgba(249,115,22,0.2)',
      }}
    >
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.2)',
                boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.15), 3px 3px 8px rgba(0,0,0,0.1)',
              }}
              animate={{ rotate: [0, -6, 6, 0] }}
              transition={{ repeat: Infinity, repeatDelay: 6, duration: 0.5 }}
            >
              <Coffee className="w-5 h-5" />
            </motion.div>
            <div>
              <h1 className="text-lg font-extrabold tracking-wide leading-tight">{siteTitle || '麻將飲料團'}</h1>
              {activeSessions.length > 0 && (
                <p className="text-[11px] text-white/60 mt-0.5 font-medium">{activeSessions.length} 個團購中 · {ordersCount} 筆訂單</p>
              )}
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <motion.button
              onClick={() => setShowMenu((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.2)',
                boxShadow: 'inset 1px 1px 3px rgba(255,255,255,0.15), 3px 3px 6px rgba(0,0,0,0.1)',
              }}
              whileTap={{ scale: 0.95 }}
            >
              {ROLE_LABELS[role]}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
            </motion.button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  className="absolute right-0 top-12 clay-card py-2 z-50 w-44 overflow-hidden"
                  initial={{ opacity: 0, scale: 0.9, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <p className="text-[11px] text-gray-400 px-4 pb-2 font-semibold uppercase tracking-wider">切換身分</p>
                  {SWITCH_OPTIONS.filter((o) => o.key !== role).map((o) => {
                    const Icon = o.icon;
                    return (
                      <button
                        key={o.key}
                        onClick={() => { onSwitchRole(o.key); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition-colors text-left cursor-pointer"
                      >
                        <Icon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">{o.label}</span>
                      </button>
                    );
                  })}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => { onLogout(); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-semibold text-red-500">登出</span>
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
