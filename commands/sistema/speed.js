async function measureMs(fn) {
  const t0 = process.hrtime.bigint();
  await fn();
  const t1 = process.hrtime.bigint();
  return Number(t1 - t0) / 1e6;
}

module.exports = {
  command: ['speed', 'velocidad', 'ping'],
  description: 'Mide latencia y velocidad basica (sin mostrar IP)',
  categoria: 'sistema',
  run: async (client, m, args, from, isCreator, ctx = {}) => {
    const axios = ctx?.axios;
    if (!axios) {
      await client.sendMessage(from, { text: 'Axios no disponible en contexto.' }, { quoted: m });
      return;
    }

    await client.sendMessage(from, { text: '⏳ Midiendo velocidad y latencia...' }, { quoted: m });

    try {
      const apiMs = await measureMs(async () => {
        await axios.get('https://dv-yer-api.online/health', { timeout: 15000 });
      });

      const dlMs = await measureMs(async () => {
        await axios.get('https://dv-yer-api.online/openapi.json', {
          timeout: 25000,
          responseType: 'arraybuffer',
        });
      });

      const text =
`╔════════════════════════════╗
║     *SPEED TEST BOT*       ║
╚════════════════════════════╝
📡 Latencia API: *${apiMs.toFixed(0)} ms*
🚀 Descarga base: *${dlMs.toFixed(0)} ms*
🛡️ Seguridad: _IP no mostrada_`;

      await client.sendMessage(from, { text }, { quoted: m });
    } catch (error) {
      await client.sendMessage(from, { text: `Error en .speed: ${String(error?.message || error)}` }, { quoted: m });
    }
  },
};
