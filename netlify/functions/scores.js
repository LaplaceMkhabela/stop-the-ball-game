const { getStore } = require('@netlify/blobs');

const STORE_NAME = 'stop-the-ball-leaderboard';
const MAX_RETURN = 20;

function respond(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    },
    body: JSON.stringify(payload)
  };
}

function clean(value, max) {
  return String(value == null ? '' : value).slice(0, max);
}

exports.handler = async (event) => {
  const store = getStore(STORE_NAME);
  const method = event.httpMethod;

  if (method === 'GET') {
    const { blobs } = await store.list();
    const entries = blobs
      .map((blob) => blob.metadata)
      .filter((entry) => entry && typeof entry.score === 'number')
      .sort((a, b) => b.score - a.score || a.ts - b.ts)
      .slice(0, MAX_RETURN);
    return respond(200, { entries });
  }

  if (method === 'POST') {
    let data;
    try {
      data = JSON.parse(event.body || '{}');
    } catch (error) {
      return respond(400, { error: 'invalid-json' });
    }

    const pid = clean(data.pid, 64);
    const name = clean(data.name, 16).trim();
    const avatar = clean(data.avatar, 8);
    const score = Math.max(0, Math.floor(Number(data.score) || 0));
    const level = Math.max(1, Math.floor(Number(data.level) || 1));

    if (!pid || !name || !avatar || score <= 0) {
      return respond(400, { error: 'invalid-entry' });
    }

    const key = 'player_' + pid;
    const existing = await store.getMetadata(key);
    if (existing && Number(existing.score) >= score) {
      return respond(200, { updated: false, score: Number(existing.score) });
    }

    const entry = { name, avatar, score, level, ts: Date.now() };
    await store.setJSON(key, entry, { metadata: entry });
    return respond(200, { updated: true, score });
  }

  return respond(405, { error: 'method-not-allowed' });
};
