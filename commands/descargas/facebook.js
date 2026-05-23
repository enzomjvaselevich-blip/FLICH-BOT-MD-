const { callApi, extractMediaUrl } = require('./_api');

module.exports = {
  command: ['facebook', 'fb'],
  description: 'Descarga video de Facebook',
  categoria: 'descargas',
  run: async (client, m, args, from, isCreator, ctx = {}) => {
    const link = String(args[0] || '').trim();
    if (!link) {
      await client.sendMessage(from, { text: 'Uso: .facebook <link>' }, { quoted: m });
      return;
    }

    await client.sendMessage(from, { text: 'Procesando Facebook...' }, { quoted: m });

    try {
      const result = await callApi(ctx, 'facebook', { url: link });
      const mediaUrl = extractMediaUrl(result);
      if (!mediaUrl) {
        await client.sendMessage(from, { text: 'La API no devolvio video de Facebook.' }, { quoted: m });
        return;
      }

      await client.sendMessage(from, { video: { url: mediaUrl }, caption: 'Facebook descargado' }, { quoted: m });
    } catch (error) {
      await client.sendMessage(from, { text: `Error en .facebook: ${String(error?.message || error)}` }, { quoted: m });
    }
  },
};
