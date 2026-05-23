const { extractMediaUrl, extractTitle, toAbsoluteUrl } = require('./_api');

const API_BASE = 'https://dv-yer-api.online';
const API_KEY = 'dvyer911840240197';
const CACHE_TTL_MS = 10 * 60 * 1000;

function getStore() {
  if (!global.playSearchStore) global.playSearchStore = new Map();
  return global.playSearchStore;
}

function cacheKey(from = '', sender = '') {
  return `${from}|${sender}`;
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

function pickVideoUrl(result = {}, apiBase = '') {
  return toAbsoluteUrl(extractMediaUrl(result), apiBase);
}

async function searchYouTube(axios, query) {
  const resp = await axios.get(`${API_BASE}/ytsearch`, {
    params: { q: query, limit: 8, apikey: API_KEY },
    timeout: 60000,
  });
  return Array.isArray(resp?.data?.results) ? resp.data.results : [];
}

async function sendMp3(client, from, quoted, axios, targetUrl, fallbackTitle = 'audio') {
  const response = await axios.get(`${API_BASE}/ytmp3`, {
    params: { url: targetUrl, apikey: API_KEY },
    timeout: 60000,
  });
  const result = response?.data?.result || response?.data?.data || response?.data || {};
  const title = extractTitle(result, fallbackTitle);
  const urls = buildAudioCandidates(result, API_BASE);
  if (!urls.length) throw new Error('La API no devolvio URL de audio.');

  let lastError = '';
  for (const url of urls) {
    try {
      await client.sendMessage(from, {
        audio: { url },
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`,
      }, { quoted });
      return;
    } catch (e) {
      lastError = String(e?.message || e);
    }
  }

  throw new Error(lastError || 'No pude enviar el audio MP3.');
}

async function sendMp4(client, from, quoted, axios, targetUrl, fallbackTitle = 'video') {
  const response = await axios.get(`${API_BASE}/ytmp4`, {
    params: { url: targetUrl, apikey: API_KEY },
    timeout: 60000,
  });
  const result = response?.data?.result || response?.data?.data || response?.data || {};
  const title = extractTitle(result, fallbackTitle);
  const url = pickVideoUrl(result, API_BASE);
  if (!url) throw new Error('La API no devolvio URL de video.');

  await client.sendMessage(from, {
    video: { url },
    caption: `Listo: ${title}`,
  }, { quoted });
}

module.exports = {
  command: ['play'],
  description: 'Busca en YouTube y te deja elegir MP3 o MP4',
  categoria: 'descargas',
  run: async (client, m, args, from, isCreator, ctx = {}) => {
    const axios = ctx?.axios;
    if (!axios) {
      await client.sendMessage(from, { text: 'Axios no disponible en contexto.' }, { quoted: m });
      return;
    }

    const sender = (m.key.participant || m.key.remoteJid || '').toString();
    const key = cacheKey(from, sender);
    const input = String(args.join(' ') || '').trim();

    if (!input) {
      await client.sendMessage(from, {
        text:
`Uso:
` +
`.play <busqueda>\n` +
`.play mp3 <numero>\n` +
`.play mp4 <numero>`
      }, { quoted: m });
      return;
    }

    const pickMatch = input.match(/^(mp3|mp4)\s+(\d{1,2})$/i);
    if (pickMatch) {
      const mode = pickMatch[1].toLowerCase();
      const index = Number(pickMatch[2]);
      const store = getStore();
      const data = store.get(key);

      if (!data || !Array.isArray(data.results) || !data.results.length) {
        await client.sendMessage(from, { text: 'No hay busqueda activa. Usa primero: .play <nombre>' }, { quoted: m });
        return;
      }

      if (Date.now() - Number(data.at || 0) > CACHE_TTL_MS) {
        store.delete(key);
        await client.sendMessage(from, { text: 'La seleccion expiro. Vuelve a buscar con .play <nombre>.' }, { quoted: m });
        return;
      }

      const selected = data.results[index - 1];
      if (!selected || !selected.url) {
        await client.sendMessage(from, { text: `Numero invalido. Elige entre 1 y ${data.results.length}.` }, { quoted: m });
        return;
      }

      await client.sendMessage(from, { text: `Procesando ${mode.toUpperCase()} de: ${selected.title}` }, { quoted: m });

      try {
        if (mode === 'mp3') {
          await sendMp3(client, from, m, axios, selected.url, selected.title || 'audio');
        } else {
          await sendMp4(client, from, m, axios, selected.url, selected.title || 'video');
        }
      } catch (error) {
        await client.sendMessage(from, { text: `Error en .play ${mode}: ${String(error?.message || error)}` }, { quoted: m });
      }
      return;
    }

    await client.sendMessage(from, { text: 'Buscando en YouTube...' }, { quoted: m });

    try {
      const results = await searchYouTube(axios, input);
      if (!results.length) {
        await client.sendMessage(from, { text: 'No encontre resultados en YouTube.' }, { quoted: m });
        return;
      }

      const top = results.slice(0, 8);
      getStore().set(key, { at: Date.now(), results: top });

      const listText = top.map((item, i) => {
        const title = String(item?.title || 'Sin titulo');
        const channel = String(item?.channel || 'Canal desconocido');
        const duration = String(item?.duration_seconds || 0);
        return `${i + 1}. ${title}\n   Canal: ${channel} | Dur: ${duration}s`;
      }).join('\n\n');

      const caption =
`Resultados para: ${input}\n\n${listText}\n\n` +
`Selecciona asi:\n` +
`- .play mp3 <numero>\n` +
`- .play mp4 <numero>\n\n` +
`Ejemplo: .play mp3 1`;

      const thumb = top[0]?.thumbnail;
      if (thumb) {
        await client.sendMessage(from, { image: { url: thumb }, caption }, { quoted: m });
      } else {
        await client.sendMessage(from, { text: caption }, { quoted: m });
      }
    } catch (error) {
      await client.sendMessage(from, { text: `Error en .play: ${String(error?.message || error)}` }, { quoted: m });
    }
  },
};
