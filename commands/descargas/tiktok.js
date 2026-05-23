const { callApi, extractMediaUrl } = require('./_api');

module.exports = {
  command: ['tiktok', 'tt'],
  description: 'Descarga video de TikTok',
  categoria: 'descargas',
  run: async (client, m, args, from, isCreator, ctx = {}) => {
    const link = String(args[0] || '').trim();
    if (!link) {
      await client.sendMessage(from, { text: 'Uso: .tiktok <link>' }, { quoted: m });
      return;
    }

    await client.sendMessage(from, { text: 'Procesando TikTok...' }, { quoted: m });

    try {
      const result = await callApi(ctx, 'tiktok', { url: link });
      const mediaUrl = extractMediaUrl(result);
      if (!mediaUrl) {
        await client.sendMessage(from, { text: 'La API no devolvio video de TikTok.' }, { quoted: m });
        return;
      }

      await client.sendMessage(from, { video: { url: mediaUrl }, caption: 'TikTok descargado' }, { quoted: m });
    } catch (error) {
      await client.sendMessage(from, { text: `Error en .tiktok: ${String(error?.message || error)}` }, { quoted: m });
    }
  },
};
