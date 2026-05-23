const { extractMediaUrl, extractTitle, toAbsoluteUrl } = require('./_api');

const API_BASE = 'https://dv-yer-api.online';
const API_KEY = 'dvyer911840240197';
async function react(client, m, emoji) {
  try {
    await client.sendMessage(m.key.remoteJid, { react: { text: emoji, key: m.key } });
  } catch {}
}

function isYouTubeUrl(text = '') {
  return /(?:youtu\.be\/|youtube\.com\/)/i.test(String(text || ''));
}

function buildAudioCandidates(result = {}, apiBase = '') {
  const rawList = [
    extractMediaUrl(result),
    result?.download_url_full,
    result?.stream_url_full,
    result?.provider_direct_url,
    result?.download_url,
    result?.stream_url,
    result?.url,
    result?.download,
    result?.audio,
  ];
  const unique = new Set();
  for (const raw of rawList) {
    const abs = toAbsoluteUrl(raw, apiBase);
    if (abs) unique.add(abs);
  }
  return [...unique];
}

module.exports = {
  command: ['ytmp3', 'musica'],
  description: 'Descarga audio MP3 directo por nombre o link',
  categoria: 'descargas',
  run: async (client, m, args, from, isCreator, ctx = {}) => {
    const axios = ctx?.axios;
    if (!axios) {
      await client.sendMessage(from, { text: 'Axios no disponible en contexto.' }, { quoted: m });
      return;
    }

    const query = String(args.join(' ') || '').trim();
    if (!query) {
      await client.sendMessage(from, { text: 'Uso: .ytmp3 <nombre o link>' }, { quoted: m });
      return;
    }

    await react(client, m, '⏳');
    await client.sendMessage(from, {
      text:
`╔══════════════════════╗
║  *HIYUKI MP3 ENGINE* ║
╚══════════════════════╝
_🔎 Buscando audio..._
⏳ *Preparando descarga MP3*`,
    }, { quoted: m });

    try {
      let targetUrl = query;
      if (!isYouTubeUrl(query)) {
        const search = await axios.get(`${API_BASE}/ytsearch`, {
          params: { q: query, limit: 1, apikey: API_KEY },
          timeout: 60000,
        });
        targetUrl = search?.data?.results?.[0]?.url || '';
      }

      if (!targetUrl) {
        await client.sendMessage(from, { text: 'No encontre resultados en YouTube.' }, { quoted: m });
        return;
      }

      const response = await axios.get(`${API_BASE}/ytmp3`, {
        params: { url: targetUrl, apikey: API_KEY },
        timeout: 60000,
      });
      const result = response?.data?.result || response?.data?.data || response?.data || {};
      const title = extractTitle(result, query);
      const urls = buildAudioCandidates(result, API_BASE);

      if (!urls.length) {
        await client.sendMessage(from, { text: 'La API no devolvio URL de audio.' }, { quoted: m });
        return;
      }

      let sent = false;
      let lastError = '';
      for (const url of urls) {
        try {
          await client.sendMessage(from, {
            audio: { url },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`,
          }, { quoted: m });
          await react(client, m, '✅');
          sent = true;
          break;
        } catch (e) {
          lastError = String(e?.message || e);
        }
      }

      if (!sent) {
        throw new Error(lastError || 'No pude enviar el MP3.');
      }
    } catch (error) {
      await react(client, m, '❌');
      await client.sendMessage(from, { text: `Error en .ytmp3: ${String(error?.message || error)}` }, { quoted: m });
    }
  },
};
