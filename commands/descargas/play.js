const { callApi, extractMediaUrl, extractTitle } = require('./_api');

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
      const result = await callApi(ctx, 'ytmp3', { q: query });
      const mediaUrl = extractMediaUrl(result);
      const title = extractTitle(result, query);

      if (!mediaUrl) {
        await client.sendMessage(from, { text: 'La API no devolvio URL de audio.' }, { quoted: m });
        return;
      }

      await client.sendMessage(from, {
        audio: { url: mediaUrl },
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`,
      }, { quoted: m });
    } catch (error) {
      const msg = String(error?.message || error);
      if (msg === 'FALTA_CONFIG_API') {
        await client.sendMessage(from, {
          text: 'Falta configurar API. Usa .setapi base <url> y .setapi key <apikey>',
        }, { quoted: m });
        return;
      }

      await client.sendMessage(from, { text: `Error en .play: ${msg}` }, { quoted: m });
    }
  },
};
