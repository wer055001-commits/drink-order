export default async function handler(req, res) {
  const { path } = req.query;
  if (!path) return res.status(400).json({ error: 'missing path' });

  const target = `https://loctw-service-api.nidin.shop/shopper/v2/${path}`;
  try {
    const resp = await fetch(target, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    });
    const data = await resp.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
