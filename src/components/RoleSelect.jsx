import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Coffee, Settings, ArrowRight } from 'lucide-react';

const ROLES = [
  {
    key: 'leader',
    icon: ClipboardList,
    title: '團主',
    desc: '開團、管理訂單、結單分享',
    gradient: 'from-violet-500 to-fuchsia-500',
    glow: 'rgba(139,92,246,0.3)',
  },
  {
    key: 'user',
    icon: Coffee,
    title: '使用者',
    desc: '點飲料、查看訂單',
    gradient: 'from-orange-400 to-pink-500',
    glow: 'rgba(251,146,60,0.3)',
  },
];

export default function RoleSelect({ onSelect, siteTitle }) {
  const [remember, setRemember] = useState(false);
  const [logoTaps, setLogoTaps] = useState(0);

  function handleLogoTap() {
    const next = logoTaps + 1;
    setLogoTaps(next);
    if (next >= 5) { onSelect('admin', remember); setLogoTaps(0); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 relative overflow-hidden" style={{ background: '#0f0f1a' }}>
      {/* 背景光暈 */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #f472b6 0%, transparent 70%)' }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center cursor-pointer select-none relative"
            style={{
              background: 'linear-gradient(135deg, #a78bfa, #f472b6, #fb923c)',
              boxShadow: '0 8px 40px rgba(167,139,250,0.35)',
            }}
            animate={{ rotate: [0, -4, 4, -2, 2, 0] }}
            transition={{ delay: 0.5, duration: 0.8 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleLogoTap}
          >
            <Coffee className="w-12 h-12 text-white" strokeWidth={1.8} />
          </motion.div>
          <h1 className="text-4xl font-black text-white tracking-tight">{siteTitle || '麻將飲料團'}</h1>
          <p className="text-white/40 mt-3 text-sm font-medium">選擇身分，開始點餐</p>
        </motion.div>

        {/* 角色卡片 */}
        <div className="space-y-4">
          {ROLES.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.button
                key={r.key}
                onClick={() => onSelect(r.key, remember)}
                className="w-full glow-card p-5 text-left cursor-pointer group"
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 bg-gradient-to-br ${r.gradient} rounded-2xl flex items-center justify-center shrink-0`}
                    style={{ boxShadow: `0 4px 20px ${r.glow}` }}
                  >
                    <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg text-white">{r.title}</div>
                    <p className="text-sm text-white/40 mt-0.5">{r.desc}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* 記住我 */}
        <motion.label
          className="flex items-center justify-center gap-2.5 mt-10 cursor-pointer select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 accent-violet-500 rounded"
          />
          <span className="text-sm text-white/30 font-medium">記住我</span>
        </motion.label>
      </div>
    </div>
  );
}
