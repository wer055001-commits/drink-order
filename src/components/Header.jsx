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
    <header className="sticky top-0 z-50" style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-2xl mx-auto px-4 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--gradient-solid)', boxShadow: '0 2px 12px rgba(var(--accent-rgb), 0.3)' }}
            >
              <Coffee className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-wide leading-tight" style={{ color: 'var(--text)' }}>{siteTitle || '麻將飲料團'}</h1>
              {activeSessions.length > 0 && (
                <p className="text-[11px] mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>{activeSessions.length} 個團購 · {ordersCount} 筆訂單</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 主題切換 */}
            <motion.button
              onClick={onToggleTheme}
              className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              whileTap={{ scale: 0.9 }}
              title={theme === 'dark' ? '切換淺色' : '切換深色'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-violet-400" />}
            </motion.button>

          <div className="relative" ref={menuRef}>
            <motion.button
              onClick={() => setShowMenu((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full cursor-pointer"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              whileTap={{ scale: 0.95 }}
            >
              {ROLE_LABELS[role]}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
            </motion.button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  className="absolute right-0 top-12 py-2 z-50 w-44 overflow-hidden rounded-2xl"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
                  initial={{ opacity: 0, scale: 0.9, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <p className="text-[10px] px-4 pb-2 font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>切換身分</p>
                  {SWITCH_OPTIONS.filter((o) => o.key !== role).map((o) => {
                    const Icon = o.icon;
                    return (
                      <button key={o.key} onClick={() => { onSwitchRole(o.key); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left cursor-pointer">
                        <Icon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{o.label}</span>
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
