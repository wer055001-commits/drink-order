import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Coffee, Settings, ChevronRight } from 'lucide-react';

const VISIBLE_ROLES = [
  {
    key: 'leader',
    icon: ClipboardList,
    title: '團主',
    desc: '開啟點餐、查看訂單、匯總分享',
    color: '#f97316',
    bg: 'bg-gradient-to-br from-orange-400 to-amber-400',
  },
  {
    key: 'user',
    icon: Coffee,
    title: '使用者',
    desc: '點飲料、查看本次訂單',
    color: '#3b82f6',
    bg: 'bg-gradient-to-br from-blue-400 to-cyan-400',
  },
];

export default function RoleSelect({ onSelect, siteTitle }) {
  const [remember, setRemember] = useState(false);
  const [logoTaps, setLogoTaps] = useState(0);

  function handleLogoTap() {
    const next = logoTaps + 1;
    setLogoTaps(next);
    if (next >= 5) {
      onSelect('admin', remember);
      setLogoTaps(0);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: 'linear-gradient(160deg, #fef3e2 0%, #fef6ee 40%, #fdf2f8 100%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: 'spring' }}
        >
          <motion.div
            className="w-24 h-24 rounded-[28px] mx-auto mb-5 flex items-center justify-center cursor-pointer select-none"
            style={{
              background: 'linear-gradient(135deg, #fb923c, #f97316)',
              boxShadow: '8px 8px 16px rgba(249,115,22,0.25), -4px -4px 12px rgba(255,255,255,0.6)',
            }}
            animate={{ rotate: [0, -5, 5, -3, 3, 0] }}
            transition={{ delay: 0.4, duration: 0.7 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogoTap}
          >
            <Coffee className="w-12 h-12 text-white" strokeWidth={2} />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-gray-800">{siteTitle || '麻將飲料團'}</h1>
          <p className="text-gray-400 mt-2 text-sm font-medium">選擇你的身分開始使用</p>
        </motion.div>

        {/* 角色卡片 */}
        <div className="space-y-4">
          {VISIBLE_ROLES.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.button
                key={r.key}
                onClick={() => onSelect(r.key, remember)}
                className="w-full clay-card p-5 text-left cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.12, duration: 0.4, type: 'spring' }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 ${r.bg} rounded-2xl flex items-center justify-center shrink-0`}
                    style={{ boxShadow: `4px 4px 10px ${r.color}30, -2px -2px 6px rgba(255,255,255,0.5)` }}
                  >
                    <Icon className="w-7 h-7 text-white" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg text-gray-800">{r.title}</div>
                    <p className="text-sm text-gray-400 mt-0.5">{r.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* 記住我 */}
        <motion.label
          className="flex items-center justify-center gap-2.5 mt-8 cursor-pointer select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 accent-orange-500 rounded"
          />
          <span className="text-sm text-gray-400 font-medium">記住我（下次自動登入）</span>
        </motion.label>
      </div>
    </div>
  );
}
