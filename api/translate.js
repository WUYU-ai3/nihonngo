/**
 * Vercel Serverless Function — DeepSeek API 代理
 *
 * Key 优先级:
 *   1. 用户自己带的 Key（x-api-key header）→ 可选
 *   2. 服务器环境变量 DEEPSEEK_API_KEY       → 部署时配一次，所有人共用
 */

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve(null); }
    });
  });
}

function send(res, code, data) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    return send(res, 405, { error: '只支持 POST' });
  }

  const body = await readBody(req);
  if (!body) return send(res, 400, { error: { message: '请求体错误' } });

  // 优先用用户自己的 Key，否则用服务器共享 Key
  const apiKey = req.headers['x-api-key'] || process.env.DEEPSEEK_API_KEY || '';

  if (!apiKey) {
    return send(res, 401, { error: { message: '未配置 API Key，请联系站长' } });
  }

  try {
    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    return send(res, resp.status, data);
  } catch (err) {
    return send(res, 502, { error: { message: `服务暂不可用: ${err.message}` } });
  }
}
