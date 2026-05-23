const { callApi, extractMediaUrl, extractTitle } = require('./_api');

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
      const result = await callApi(ctx, 'ytmp4', { q: query });
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
