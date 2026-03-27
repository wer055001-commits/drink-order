// ── 你訂 API 共用工具 ────────────────────────────────────────────

export function parseNidinMenu(data) {
  const productJson = data.menu?.product_list_json;
  if (!productJson) return [];
  const s = productJson.schema;
  const nameIdx = s.name ?? 2;
  const priceIdx = s.price ?? 4;
  const enableIdx = typeof s.is_enable !== 'undefined' ? s.is_enable : 15;
  return Object.entries(productJson.data)
    .map(([, vals]) => ({ name: vals[nameIdx], price: parseInt(vals[priceIdx]) || 0, enabled: vals[enableIdx] }))
    .filter((p) => p.enabled && p.name && p.price > 0)
    .map((p) => ({ name: p.name, price: p.price, sizes: [{ label: 'M', add: 0 }] }));
}

export function fuzzyScore(text, query) {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t.includes(q)) return 1;
  let qi = 0, bonus = 0, prev = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) { bonus += (ti === prev + 1 ? 2 : 1); prev = ti; qi++; }
  }
  return qi === q.length ? bonus / (q.length * 2 + t.length) : 0;
}

export function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('此裝置不支援定位'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => reject(new Error('定位失敗，請確認已允許位置權限')),
      { timeout: 8000 }
    );
  });
}

export function formatDistance(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}
