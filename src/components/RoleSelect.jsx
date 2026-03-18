import { useState } from 'react';

const ROLE_CONFIG = [
  {
    key: 'admin',
    icon: '🔧',
    title: '管理者',
    desc: '可管理菜單、店家設定，擁有所有功能',
    border: 'border-red-400',
    bg: 'hover:bg-red-50',
  },
  {
    key: 'leader',
    icon: '📋',
    title: '團主',
    desc: '可開啟點餐、查看所有訂單、複製匯總',
    border: 'border-orange-400',
    bg: 'hover:bg-orange-50',
  },
  {
    key: 'user',
    icon: '🧋',
    title: '使用者',
    desc: '點飲料、查看本次訂單',
    border: 'border-blue-400',
    bg: 'hover:bg-blue-50',
  },
];

export default function RoleSelect({ onSelect }) {
  const [remember, setRemember] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🧋</div>
          <h1 className="text-2xl font-bold text-gray-800">麻將飲料團</h1>
          <p className="text-gray-500 mt-1">請選擇你的身分</p>
        </div>

        <div className="space-y-3">
          {ROLE_CONFIG.map((r) => (
            <button
              key={r.key}
              onClick={() => onSelect(r.key, remember)}
              className={`w-full bg-white rounded-xl border-2 ${r.border} ${r.bg} p-4 text-left transition-colors shadow-sm`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{r.icon}</span>
                <div className="flex-1">
                  <div className="font-bold text-gray-800">{r.title}</div>
                  <p className="text-sm text-gray-500 mt-0.5">{r.desc}</p>
                </div>
                <span className="text-gray-400">›</span>
              </div>
            </button>
          ))}
        </div>

        {/* 記住我 */}
        <label className="flex items-center justify-center gap-2 mt-6 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 accent-orange-500"
          />
          <span className="text-sm text-gray-500">記住我（下次自動登入）</span>
        </label>
      </div>
    </div>
  );
}
