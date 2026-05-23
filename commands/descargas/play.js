const { extractMediaUrl, extractTitle, toAbsoluteUrl } = require('./_api');
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
  command: ['play', 'ytmp3', 'musica'],
  description: 'Descarga musica de YouTube usando tu API',
  categoria: 'descargas',
  run: async (client, m, args, from, isCreator, ctx = {}) => {
    const query = String(args.join(' ') || '').trim();

    if (!query) {
      await client.sendMessage(from, { text: 'Uso: .play nombre de la cancion' }, { quoted: m });
      return;
    }

    await client.sendMessage(from, { text: 'Buscando audio de YouTube...' }, { quoted: m });

    try {
      const axios = ctx?.axios;
      const apiBase = 'https://dv-yer-api.online';
      const apiKey = 'dvyer911840240197';
      if (!axios) throw new Error('Axios no disponible en contexto.');

      let targetUrl = query;
      if (!isYouTubeUrl(query)) {
        const search = await axios.get(`${apiBase}/ytsearch`, {
          params: { q: query, limit: 1, apikey: apiKey },
          timeout: 60000,
        });
        const first = search?.data?.results?.[0];
        targetUrl = first?.url || '';
      }
      if (!targetUrl) {
        await client.sendMessage(from, { text: 'No encontre resultados en YouTube.' }, { quoted: m });
        return;
      }

      const response = await axios.get(`${apiBase}/ytmp3`, {
        params: { url: targetUrl, apikey: apiKey },
        timeout: 60000,
      });
      const result = response?.data?.result || response?.data?.data || response?.data || {};
      const mediaCandidates = buildAudioCandidates(result, apiBase);
      const title = extractTitle(result, query);

      if (!mediaCandidates.length) {
        await client.sendMessage(from, { text: 'La API no devolvio URL de audio.' }, { quoted: m });
        return;
      }

      let sent = false;
      let lastError = '';
      for (const mediaUrl of mediaCandidates) {
        try {
          await client.sendMessage(from, {
            audio: { url: mediaUrl },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`,
          }, { quoted: m });
          sent = true;
          break;
        } catch (e) {
          lastError = String(e?.message || e);
        }
      }
      if (!sent) {
        throw new Error(lastError || 'No pude enviar el audio MP3.');
      }
    } catch (error) {
      await client.sendMessage(from, { text: `Error en .play: ${String(error?.message || error)}` }, { quoted: m });
    }
  },
};
