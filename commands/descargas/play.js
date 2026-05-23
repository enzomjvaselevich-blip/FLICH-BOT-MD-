module.exports = {
  command: ['play', 'ytmp3', 'musica'],
  description: 'Descarga musica de YouTube usando tu API',
  categoria: 'descargas',
  run: async (client, m, args, from, isCreator, ctx = {}) => {
    const axios = ctx?.axios;
    const settings = ctx?.settings || {};
    const query = String(args.join(' ') || '').trim();

    if (!query) {
      await client.sendMessage(from, { text: 'Uso: .play nombre de la cancion' }, { quoted: m });
      return;
    }

    const apiBaseUrl = String(settings.apiBaseUrl || '').trim();
    const apiKey = String(settings.apiKey || '').trim();

    if (!apiBaseUrl || !apiKey) {
      await client.sendMessage(from, {
        text:
          '*FALTA CONFIG API*\n\n' +
          'Owner configura:\n' +
          '- .setapi base https://tu-api.com\n' +
          '- .setapi key TU_API_KEY',
      }, { quoted: m });
      return;
    }

    await client.sendMessage(from, { text: 'Buscando y descargando audio, espera un momento...' }, { quoted: m });

    try {
      const url = `${apiBaseUrl.replace(/\/$/, '')}/ytmp3`;
      const res = await axios.get(url, {
        params: { q: query, apikey: apiKey },
        timeout: 45000,
      });

      const data = res?.data || {};
      const result = data?.result || data?.data || data;
      const audioUrl = result?.url || result?.download || result?.audio || '';
      const title = result?.title || query;

      if (!audioUrl) {
        await client.sendMessage(from, { text: 'La API no devolvio URL de audio.' }, { quoted: m });
        return;
      }

      await client.sendMessage(from, {
        audio: { url: audioUrl },
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`,
      }, { quoted: m });
    } catch (error) {
      await client.sendMessage(from, {
        text: `Error en descarga: ${String(error?.message || error)}`,
      }, { quoted: m });
    }
  },
};
