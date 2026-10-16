const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmd) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || 'redis error');
  return j.result;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || (req.headers.authorization || '') !== 'Bearer ' + pw) {
    return res.status(401).json({ error: 'Нууц үг буруу' });
  }
  try {
    const list = await redis(['LRANGE', 'registrations', 0, -1]);
    const rows = list.map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
    return res.status(200).json(rows);
  } catch (e) {
    return res.status(500).json({ error: 'Серверийн алдаа' });
  }
};
