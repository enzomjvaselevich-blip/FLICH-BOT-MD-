const API_BASE = 'https://dv-yer-api.online';
const API_KEY = 'dvyer911840240197';

function shortText(text = '', max = 55) {
  const t = String(text || '').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}...`;
}

module.exports = {
  command: ['play'],
  description: 'Busca canciones y muestra selector para descargar MP3',
  categoria: 'descargas',
  run: async (client, m, args, from, isCreator, ctx = {}) => {
    const axios = ctx?.axios;
    const prefix = ctx?.prefix || '.';

    if (!axios) {
      await client.sendMessage(from, { text: 'Axios no disponible en contexto.' }, { quoted: m });
      return;
    }

    const query = String(args.join(' ') || '').trim();
    if (!query) {
      await client.sendMessage(from, { text: `Uso: ${prefix}play <nombre de cancion>` }, { quoted: m });
      return;
    }

    await client.sendMessage(from, { text: 'Buscando canciones en YouTube...' }, { quoted: m });

    try {
      const search = await axios.get(`${API_BASE}/ytsearch`, {
        params: { q: query, limit: 8, apikey: API_KEY },
        timeout: 60000,
      });
      const results = Array.isArray(search?.data?.results) ? search.data.results : [];

      if (!results.length) {
        await client.sendMessage(from, { text: 'No encontre resultados en YouTube.' }, { quoted: m });
        return;
      }

      const top = results.slice(0, 8).filter((x) => x?.url);
      if (!top.length) {
        await client.sendMessage(from, { text: 'No encontre resultados validos.' }, { quoted: m });
        return;
      }

      const rows = top.map((item, i) => ({
        title: `${i + 1}. ${shortText(item?.title || 'Sin titulo')}`,
        description: `${shortText(item?.channel || 'Canal desconocido', 28)} | ${item?.duration_seconds || 0}s`,
        rowId: `${prefix}ytmp3 ${item.url}`,
      }));

      const listPayload = {
        text: `Resultados para: ${query}\nToca una opcion para descargar MP3 directo.`,
        footer: 'HIYUKI-BOT',
        title: 'Selector de canciones',
        buttonText: 'Elegir cancion',
        sections: [
          {
            title: 'Descargar MP3',
            rows,
          },
        ],
      };

      if (top[0]?.thumbnail) {
        await client.sendMessage(from, {
          image: { url: top[0].thumbnail },
          caption: `Resultados para: ${query}\nPulsa "Elegir cancion" para descargar.`,
        }, { quoted: m });
      }

      await client.sendMessage(from, listPayload, { quoted: m });
    } catch (error) {
      await client.sendMessage(from, { text: `Error en .play: ${String(error?.message || error)}` }, { quoted: m });
    }
  },
};
