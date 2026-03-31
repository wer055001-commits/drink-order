import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Coffee, Settings, ChevronRight } from 'lucide-react';

const VISIBLE_ROLES = [
  {
    key: 'leader',
    icon: ClipboardList,
    title: '團主',
    desc: '開啟點餐、查看訂單、匯總分享',
    gradient: 'from-orange-500 to-amber-400',
    lightBg: 'bg-orange-50',
  },
  {
    key: 'user',
    icon: Coffee,
    title: '使用者',
    desc: '點飲料、查看本次訂單',
    gradient: 'from-blue-500 to-cyan-400',
    lightBg: 'bg-blue-50',
  },
];

export default function RoleSelect({ onSelect, siteTitle }) {
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-400 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/25 cursor-pointer select-none"
            animate={{ rotate: [0, -6, 6, -3, 3, 0] }}
            transition={{ delay: 0.3, duration: 0.6 }}
            onClick={handleLogoTap}
          >
            <Coffee className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-800">{siteTitle || '麻將飲料團'}</h1>
          <p className="text-gray-400 mt-1.5 text-sm">請選擇你的身分</p>
        </motion.div>

        <div className="space-y-3">
          {VISIBLE_ROLES.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.button
                key={r.key}
                onClick={() => onSelect(r.key, remember)}
                className="w-full bg-white rounded-2xl p-4 text-left shadow-sm shadow-gray-200/50 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.35 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 ${r.lightBg} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon className={`w-6 h-6 bg-gradient-to-br ${r.gradient} bg-clip-text`} style={{ color: r.key === 'leader' ? '#f97316' : '#3b82f6' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800">{r.title}</div>
                    <p className="text-sm text-gray-400 mt-0.5">{r.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
                </div>
              </motion.button>
            );
          })}

          <AnimatePresence>
            {showAdmin && (
              <motion.button
                onClick={() => onSelect('admin', remember)}
                className="w-full bg-white rounded-2xl p-4 text-left shadow-sm shadow-gray-200/50 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer"
                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                    <Settings className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800">管理者</div>
                    <p className="text-sm text-gray-400 mt-0.5">管理菜單、店家設定，擁有所有功能</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <motion.label
          className="flex items-center justify-center gap-2.5 mt-8 cursor-pointer select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 accent-orange-500 rounded"
          />
          <span className="text-sm text-gray-400">記住我（下次自動登入）</span>
        </motion.label>
      </div>
    </div>
  );
}
