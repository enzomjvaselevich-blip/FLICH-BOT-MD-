const { callApi, extractMediaUrl } = require('./_api');

module.exports = {
  command: ['instagram', 'ig'],
  description: 'Descarga video de Instagram',
  categoria: 'descargas',
  run: async (client, m, args, from, isCreator, ctx = {}) => {
    const link = String(args[0] || '').trim();
    if (!link) {
      await client.sendMessage(from, { text: 'Uso: .instagram <link>' }, { quoted: m });
      return;
    }

    await client.sendMessage(from, { text: 'Procesando Instagram...' }, { quoted: m });

    try {
      const result = await callApi(ctx, 'instagram', { url: link });
      const mediaUrl = extractMediaUrl(result);
      if (!mediaUrl) {
        await client.sendMessage(from, { text: 'La API no devolvio media de Instagram.' }, { quoted: m });
        return;
      }

      await client.sendMessage(from, { video: { url: mediaUrl }, caption: 'Instagram descargado' }, { quoted: m });
    } catch (error) {
      await client.sendMessage(from, { text: `Error en .instagram: ${String(error?.message || error)}` }, { quoted: m });
    }
  },
};
