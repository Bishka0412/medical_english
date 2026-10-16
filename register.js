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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  if (b.website) return res.status(200).json({ ok: true }); // spam trap
  const name = String(b.name || '').trim().slice(0, 100);
  const phone = String(b.phone || '').trim().slice(0, 20);
  const course = String(b.course || '').trim().slice(0, 100);
  if (!name || !/^[0-9+\s-]{6,20}$/.test(phone)) return res.status(400).json({ error: 'Мэдээлэл буруу' });
  try {
    await redis(['LPUSH', 'registrations', JSON.stringify({ name, phone, course, at: new Date().toISOString() })]);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Серверийн алдаа' });
  }
};
