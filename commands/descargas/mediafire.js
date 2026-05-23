const { callApi, extractMediaUrl, extractTitle } = require('./_api');

module.exports = {
  command: ['mediafire', 'mf'],
  description: 'Descarga archivos de Mediafire',
  categoria: 'descargas',
  run: async (client, m, args, from, isCreator, ctx = {}) => {
    const link = String(args[0] || '').trim();
    if (!link) {
      await client.sendMessage(from, { text: 'Uso: .mediafire <link>' }, { quoted: m });
      return;
    }

    await client.sendMessage(from, { text: 'Procesando Mediafire...' }, { quoted: m });

    try {
      const result = await callApi(ctx, 'mediafire', { url: link });
      const fileUrl = extractMediaUrl(result);
      const fileName = extractTitle(result, 'archivo');

      if (!fileUrl) {
        await client.sendMessage(from, { text: 'La API no devolvio enlace de descarga.' }, { quoted: m });
        return;
      }

      await client.sendMessage(from, {
        document: { url: fileUrl },
        fileName,
        mimetype: 'application/octet-stream',
      }, { quoted: m });
    } catch (error) {
      await client.sendMessage(from, { text: `Error en .mediafire: ${String(error?.message || error)}` }, { quoted: m });
    }
  },
};
