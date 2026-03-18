import { useState, useEffect } from 'react';

function calcSeconds(exp) {
  if (!exp) return 0;
  return Math.max(0, Math.floor((new Date(exp) - Date.now()) / 1000));
}

function formatTime(seconds) {
  if (seconds <= 0) return '已截止';
  const weeks   = Math.floor(seconds / (7 * 24 * 3600));
  const days    = Math.floor((seconds % (7 * 24 * 3600)) / (24 * 3600));
  const hours   = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs    = seconds % 60;

  if (weeks > 0)  return `${weeks}週 ${days}天 ${hours}時`;
  if (days > 0)   return `${days}天 ${hours}時 ${minutes}分`;
  if (hours > 0)  return `${hours}時 ${minutes}分`;
  if (minutes > 0) return `${minutes}分 ${String(secs).padStart(2, '0')}秒`;
  return `${secs}秒`;
}

export function useCountdown(expiresAt) {
  const [secondsLeft, setSecondsLeft] = useState(() => calcSeconds(expiresAt));

  useEffect(() => {
    if (!expiresAt) return;
    setSecondsLeft(calcSeconds(expiresAt));
    const timer = setInterval(() => {
      const s = calcSeconds(expiresAt);
      setSecondsLeft(s);
      if (s <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return {
    secondsLeft,
    isExpired: secondsLeft <= 0,
    display: formatTime(secondsLeft),
  };
}
