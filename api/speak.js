/**
 * Vercel Serverless Function — 日本語 TTS
 * 使用 Microsoft Edge 神经网络声优（免费，无需 Key）
 */

const VOICE = 'ja-JP-NanamiNeural';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { text } = (await readBody(req)) || {};
  if (!text) return res.status(400).json({ error: 'no text' });

  // 去絵文字 + 去注音括号
  const clean = text
    .replace(/\([^)]*\)/g, '')
    .replace(/（[^）]*）/g, '')
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{200C}]/gu, '')
    .trim();

  // Microsoft Edge TTS（免费，神经网络品质）
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="ja-JP">
    <voice name="${VOICE}">
      <mstts:express-as style="cheerful" styledegree="0.3">
        <prosody rate="0.9" pitch="+5%">
          ${clean}
        </prosody>
      </mstts:express-as>
    </voice>
  </speak>`;

  try {
    const tts = await fetch(
      `https://eastus.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/ssml+xml',
          'Ocp-Apim-Subscription-Key': process.env.AZURE_TTS_KEY || '',
          'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        },
        body: ssml,
      }
    );

    if (!tts.ok) {
      // Azure 不可用时 fallback 到 Edge 免费接口
      return fallbackEdge(clean, res);
    }

    const buf = Buffer.from(await tts.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(buf);
  } catch (e) {
    return fallbackEdge(clean, res);
  }
}

async function fallbackEdge(text, res) {
  // Edge 免费 TTS（无需 Key）
  const url = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491C6F4`;
  const body = JSON.stringify([
    {
      Name: 'Microsoft Server Speech Text to Speech Voice (ja-JP, NanamiNeural)',
      Content: text,
      Properties: { OutputFormat: 'audio-24khz-48kbitrate-mono-mp3' },
    },
  ]);

  try {
    const tts = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const buf = Buffer.from(await tts.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(buf);
  } catch {
    res.status(502).json({ error: 'TTS unavailable' });
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { resolve(null); }
    });
  });
}
