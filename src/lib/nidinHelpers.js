// ── 你訂 API 共用工具 ────────────────────────────────────────────

// 大●/中●/小● 尺寸對應表
const SIZE_PREFIXES = [
  { prefix: '大●', label: 'L' },
  { prefix: '中●', label: 'M' },
  { prefix: '小●', label: 'S' },
  { prefix: '大杯', label: 'L' },
  { prefix: '中杯', label: 'M' },
  { prefix: '小杯', label: 'S' },
];

function extractSize(name) {
  for (const { prefix, label } of SIZE_PREFIXES) {
    if (name.startsWith(prefix)) {
      return { baseName: name.slice(prefix.length).trim(), sizeLabel: label };
    }
  }
  return { baseName: name.trim(), sizeLabel: null };
}

export function parseNidinMenu(data) {
  const productJson = data.menu?.product_list_json;
  if (!productJson) return [];
  const s = productJson.schema;
  const nameIdx = s.name ?? 2;
  const priceIdx = s.price ?? 4;
  const enableIdx = typeof s.is_enable !== 'undefined' ? s.is_enable : 15;

  const rawItems = Object.entries(productJson.data)
    .map(([, vals]) => ({
      name: vals[nameIdx],
      price: parseInt(vals[priceIdx]) || 0,
      enabled: vals[enableIdx],
    }))
    .filter((p) => p.enabled && p.name && p.price > 0);

  // 解析尺寸前綴，依品項名稱分組
  const groups = {};
  rawItems.forEach((p) => {
    const { baseName, sizeLabel } = extractSize(p.name);
    if (!groups[baseName]) {
      groups[baseName] = { name: baseName, variants: [] };
    }
    groups[baseName].variants.push({ sizeLabel, price: p.price });
  });

  const SIZE_ORDER = { S: 0, M: 1, L: 2 };

  return Object.values(groups).map((g) => {
    const hasSizes = g.variants.some((v) => v.sizeLabel !== null);
    if (!hasSizes) {
      // 無尺寸前綴，單一尺寸
      return { name: g.name, price: g.variants[0].price, sizes: [{ label: 'M', add: 0 }] };
    }

    // 排序：S < M < L
    const sorted = g.variants
      .filter((v) => v.sizeLabel)
      .sort((a, b) => (SIZE_ORDER[a.sizeLabel] ?? 9) - (SIZE_ORDER[b.sizeLabel] ?? 9));

    const basePrice = sorted[0].price;
    return {
      name: g.name,
      price: basePrice,
      sizes: sorted.map((v) => ({ label: v.sizeLabel, add: v.price - basePrice })),
    };
  });
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

export function formatDistance(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}
