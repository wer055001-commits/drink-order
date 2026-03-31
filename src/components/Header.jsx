import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, ClipboardList, User, ChevronDown, LogOut, Sun, Moon } from 'lucide-react';

const ROLE_LABELS = { admin: '管理者', leader: '團主', user: '使用者' };
const SWITCH_OPTIONS = [
  { key: 'leader', icon: ClipboardList, label: '團主' },
  { key: 'user', icon: User, label: '使用者' },
];

export default function Header({ activeSessions, ordersCount, role, onLogout, onSwitchRole, siteTitle, theme, onToggleTheme }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return;
    function h(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showMenu]);

  return (
    <header style={{ background: 'rgba(15,15,26,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-2xl mx-auto px-4 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #f472b6)', boxShadow: '0 2px 12px rgba(167,139,250,0.3)' }}
            >
              <Coffee className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-wide leading-tight">{siteTitle || '麻將飲料團'}</h1>
              {activeSessions.length > 0 && (
                <p className="text-[11px] text-white/35 mt-0.5 font-medium">{activeSessions.length} 個團購 · {ordersCount} 筆訂單</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 主題切換 */}
            <motion.button
              onClick={onToggleTheme}
              className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.9 }}
              title={theme === 'dark' ? '切換淺色' : '切換深色'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-violet-400" />}
            </motion.button>

          <div className="relative" ref={menuRef}>
            <motion.button
              onClick={() => setShowMenu((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.95 }}
            >
              {ROLE_LABELS[role]}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
            </motion.button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  className="absolute right-0 top-12 glass-card py-2 z-50 w-44 overflow-hidden"
                  initial={{ opacity: 0, scale: 0.9, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <p className="text-[10px] text-white/30 px-4 pb-2 font-bold uppercase tracking-widest">切換身分</p>
                  {SWITCH_OPTIONS.filter((o) => o.key !== role).map((o) => {
                    const Icon = o.icon;
                    return (
                      <button key={o.key} onClick={() => { onSwitchRole(o.key); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left cursor-pointer">
                        <Icon className="w-4 h-4 text-white/40" />
                        <span className="text-sm font-semibold text-white/80">{o.label}</span>
                      </button>
                    );
                  })}
                  <div className="border-t border-white/5 mt-1 pt-1">
                    <button onClick={() => { onLogout(); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 transition-colors text-left cursor-pointer">
                      <LogOut className="w-4 h-4 text-red-400/70" />
                      <span className="text-sm font-semibold text-red-400">登出</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </div>
        </div>
      </div>
    </header>
  );
}
