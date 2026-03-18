import { useState } from 'react';

const SESSION_KEY = 'drink-order:role';
const LOCAL_KEY   = 'drink-order:role-persist';
const NAME_KEY    = 'drink-order:userName';

export const ROLES = {
  admin:  { key: 'admin',  label: '管理者', color: 'red'    },
  leader: { key: 'leader', label: '團主',   color: 'orange' },
  user:   { key: 'user',   label: '使用者', color: 'blue'   },
};

export function useAuth() {
  const [role, setRole] = useState(
    () => localStorage.getItem(LOCAL_KEY) || sessionStorage.getItem(SESSION_KEY) || null,
  );

  // remember=true → localStorage（下次開啟自動登入）
  function login(selectedRole, remember = false) {
    setRole(selectedRole);
    if (remember) {
      localStorage.setItem(LOCAL_KEY, selectedRole);
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, selectedRole);
      localStorage.removeItem(LOCAL_KEY);
    }
  }

  function logout() {
    setRole(null);
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LOCAL_KEY);
  }

  // 儲存使用者姓名（點餐後呼叫，存在 sessionStorage 方便當次篩選）
  function saveUserName(name) {
    sessionStorage.setItem(NAME_KEY, name);
  }

  function getUserName() {
    return sessionStorage.getItem(NAME_KEY) || '';
  }

  const isAdmin  = role === 'admin';
  const isLeader = role === 'leader' || role === 'admin';
  const isUser   = !!role;

  return { role, isAdmin, isLeader, isUser, login, logout, saveUserName, getUserName };
}
