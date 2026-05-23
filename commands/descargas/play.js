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
        header: '🎵',
        title: `${i + 1}. ${shortText(item?.title || 'Sin titulo')}`,
        description: `${shortText(item?.channel || 'Canal desconocido', 28)} | ${item?.duration_seconds || 0}s`,
        id: `${prefix}ytmp3 ${item.url}`,
      }));
      const sections = [
        {
          title: '🎧 RESULTADOS YTMP3',
          highlight_label: 'TOP',
          rows,
        },
      ];

      const landingText =
`Resultados para: ${query}
Pulsa *ELEGIR CANCION* y toca la opcion que quieras.
Se descarga MP3 directo sin escribir mas.`;

      const payload = {
        footer: 'HIYUKI-BOT',
        buttons: [
          {
            buttonId: 'play_select_open',
            buttonText: { displayText: '🎵 ELEGIR CANCION' },
            type: 4,
            nativeFlowInfo: {
              name: 'single_select',
              paramsJson: JSON.stringify({
                title: 'HIYUKI PLAY SELECTOR',
                sections,
              }),
            },
          },
        ],
        headerType: 1,
      };

      if (top[0]?.thumbnail) {
        payload.image = { url: top[0].thumbnail };
        payload.caption = landingText;
        payload.headerType = 4;
      } else {
        payload.text = landingText;
      }

      try {
        await client.sendMessage(from, payload, { quoted: m });
      } catch {
        const fallbackRows = rows.map((r) => ({
          title: r.title,
          description: r.description,
          rowId: r.id,
        }));
        await client.sendMessage(from, {
          text: `Resultados para: ${query}\nToca una opcion para descargar MP3 directo.`,
          footer: 'HIYUKI-BOT',
          title: 'Selector de canciones',
          buttonText: 'Elegir cancion',
          sections: [{ title: 'Descargar MP3', rows: fallbackRows }],
        }, { quoted: m });
      }
    } catch (error) {
      await client.sendMessage(from, { text: `Error en .play: ${String(error?.message || error)}` }, { quoted: m });
    }
  },
};
