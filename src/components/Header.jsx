import { useState } from 'react';

const ROLE_LABELS = { admin: '管理者', leader: '團主', user: '使用者' };
const ROLE_COLORS = { admin: 'bg-red-200 text-red-800', leader: 'bg-orange-200 text-orange-800', user: 'bg-blue-200 text-blue-800' };

export default function Header({ activeTab, onTabChange, activeSessions, ordersCount, role, onLogout }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const tabs = [
    { key: 'order', label: '點餐' },
    ...(role !== 'user' ? [{ key: 'summary', label: '訂單總覽' }] : [{ key: 'summary', label: '本次訂單' }]),
    ...(role === 'admin' ? [{ key: 'menu', label: '菜單管理' }] : []),
  ];

  return (
    <header className="bg-orange-500 text-white shadow-md">
      <div className="max-w-2xl mx-auto px-4 pt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧋</span>
            <h1 className="text-lg font-bold">麻將飲料團</h1>
          </div>
          <div className="flex items-center gap-2">
            {activeSessions.length > 0 && (
              <span className="text-xs opacity-80">{activeSessions.length} 個進行中</span>
            )}
            {/* 身分徽章 + 切換確認 */}
            <div className="relative">
              <button
                onClick={() => setShowConfirm((v) => !v)}
                className={`text-xs font-semibold px-2 py-1 rounded-full ${ROLE_COLORS[role] || 'bg-white text-orange-700'}`}
              >
                {ROLE_LABELS[role] || ''} ↩
              </button>
              {showConfirm && (
                <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-50 w-36">
                  <p className="text-xs text-gray-500 mb-2 text-center">切換身分？</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onLogout(); setShowConfirm(false); }}
                      className="flex-1 bg-red-500 text-white text-xs py-1.5 rounded-lg font-medium hover:bg-red-600"
                    >
                      切換
                    </button>
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 bg-gray-100 text-gray-600 text-xs py-1.5 rounded-lg font-medium hover:bg-gray-200"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { onTabChange(tab.key); setShowConfirm(false); }}
              className={`relative px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-white text-orange-600' : 'text-white hover:bg-orange-400'
              }`}
            >
              {tab.label}
              {tab.key === 'summary' && ordersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {ordersCount > 99 ? '99+' : ordersCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
