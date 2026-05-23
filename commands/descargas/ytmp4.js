const { extractMediaUrl, extractTitle } = require('./_api');
function isYouTubeUrl(text = '') {
  return /(?:youtu\.be\/|youtube\.com\/)/i.test(String(text || ''));
}

module.exports = {
  command: ['ytmp4', 'play2', 'video'],
  description: 'Descarga video de YouTube usando tu API',
  categoria: 'descargas',
  run: async (client, m, args, from, isCreator, ctx = {}) => {
    const query = String(args.join(' ') || '').trim();
    if (!query) {
      await client.sendMessage(from, { text: 'Uso: .ytmp4 nombre o link' }, { quoted: m });
      return;
    }

    await client.sendMessage(from, { text: 'Buscando video de YouTube...' }, { quoted: m });

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

      const response = await axios.get(`${apiBase}/ytmp4`, {
        params: { url: targetUrl, apikey: apiKey },
        timeout: 60000,
      });
      const result = response?.data?.result || response?.data?.data || response?.data || {};
      const mediaUrl = extractMediaUrl(result);
      const title = extractTitle(result, query);

      if (!mediaUrl) {
        await client.sendMessage(from, { text: 'La API no devolvio URL de video.' }, { quoted: m });
        return;
      }

      await client.sendMessage(from, {
        video: { url: mediaUrl },
        caption: `Listo: ${title}`,
      }, { quoted: m });
    } catch (error) {
      await client.sendMessage(from, { text: `Error en .ytmp4: ${String(error?.message || error)}` }, { quoted: m });
    }
  },
};
