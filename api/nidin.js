export default async function handler(req, res) {
  const { path, ...queryParams } = req.query;
  if (!path) return res.status(400).json({ error: 'missing path' });

  const searchParams = new URLSearchParams(queryParams).toString();
  const target = `https://loctw-service-api.nidin.shop/shopper/v2/${path}${searchParams ? '?' + searchParams : ''}`;

  const headers = { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' };
  if (req.headers['x-nidin-brand']) headers['MC-API-Brand-Code'] = req.headers['x-nidin-brand'];

  const fetchOpts = { headers };
  if (req.method === 'POST') {
    fetchOpts.method = 'POST';
    fetchOpts.headers['Content-Type'] = 'application/json';
    fetchOpts.body = JSON.stringify(req.body || {});
  }

  try {
    const resp = await fetch(target, fetchOpts);
    const data = await resp.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
