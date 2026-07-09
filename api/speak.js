/**
 * Vercel Serverless Function — 日本語 TTS
 * Microsoft NanamiNeural（神经网络声优，免费）
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { text } = (await readBody(req)) || {};
  if (!text) return res.status(400).json({ error: 'no text' });

  const clean = text
    .replace(/\([^)]*\)/g, '').replace(/（[^）]*）/g, '')
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '').trim();

  // Microsoft Edge TTS — NanamiNeural（日文女声，自然度远超浏览器TTS）
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="ja-JP">
    <voice name="ja-JP-NanamiNeural">
      <mstts:express-as style="cheerful" styledegree="0.2">
        <prosody rate="0.95" pitch="+3%">${clean}</prosody>
      </mstts:express-as>
    </voice>
  </speak>`;

  try {
    const tts = await fetch(
      `https://eastasia.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
          'Ocp-Apim-Subscription-Key': process.env.AZURE_TTS_KEY || '',
        },
        body: ssml,
      }
    );

    if (tts.ok) {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(Buffer.from(await tts.arrayBuffer()));
    }
  } catch (_) { /* fallthrough to Edge */ }

  // Fallback: Google Translate TTS（免费，品质OK）
  try {
    const tts = await fetch(
      `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(clean)}&tl=ja&client=tw-ob`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (tts.ok) {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(Buffer.from(await tts.arrayBuffer()));
    }
  } catch (_) {}

  res.status(502).json({ error: 'TTS unavailable' });
}

function readBody(req) {
  return new Promise((resolve) => {
    let b = '';
    req.on('data', c => { b += c; });
    req.on('end', () => { try { resolve(JSON.parse(b)); } catch { resolve(null); } });
  });
}
