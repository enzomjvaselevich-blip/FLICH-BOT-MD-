const API_BASE = 'https://dv-yer-api.online';
const API_KEY = 'dvyer911840240197';
async function react(client, m, emoji) {
  try {
    await client.sendMessage(m.key.remoteJid, { react: { text: emoji, key: m.key } });
  } catch {}
}

function shortText(text = '', max = 55) {
  const t = String(text || '').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}...`;
}
function formatDuration(seconds = 0) {
  const total = Math.max(0, Number(seconds || 0));
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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

    await react(client, m, '⏳');

    try {
      const search = await axios.get(`${API_BASE}/ytsearch`, {
        params: { q: query, limit: 8, apikey: API_KEY },
        timeout: 60000,
      });
      const results = Array.isArray(search?.data?.results)? search.data.results : [];

      if (!results.length) {
        await client.sendMessage(from, { text: 'No encontre resultados en YouTube.' }, { quoted: m });
        return;
      }

      const top = results.slice(0, 8).filter((x) => x?.url);
      if (!top.length) {
        await client.sendMessage(from, { text: 'No encontre resultados validos.' }, { quoted: m });
        return;
      }

      const rowsMp3 = top.map((item, i) => ({
        header: '🎵',
        title: `${i + 1}. ${shortText(item?.title || 'Sin titulo')}`,
        description: `Canal: ${shortText(item?.channel || 'Canal desconocido', 20)} • ${formatDuration(item?.duration_seconds || 0)} • MP3`,
        id: `${prefix}ytmp3 ${item.url}`,
      }));
      const rowsMp4 = top.map((item, i) => ({
        header: '🎬',
        title: `${i + 1}. ${shortText(item?.title || 'Sin titulo')}`,
        description: `Canal: ${shortText(item?.channel || 'Canal desconocido', 20)} • ${formatDuration(item?.duration_seconds || 0)} • MP4`,
        id: `${prefix}ytmp4 ${item.url}`,
      }));
      const sections = [
        {
          title: '🎧 RESULTADOS YTMP3',
          highlight_label: 'TOP',
          rows: rowsMp3,
        },
        {
          title: '🎥 RESULTADOS YTMP4',
          highlight_label: 'VIDEO',
          rows: rowsMp4,
        },
      ];

      const landingText =
`𓊆ྀི❤︎𓊇ྀི *FLICH - BOT - MD* 𓊆ྀི❤︎𓊇ྀི

𓈈 Busqueda: *${query}*
𓈈 Modo: _Selector interactivo_

𓊝 Pulsa *ELEGIR CANCION* y elige:
  🎧 MP3 𓂃 audio
  🎥 MP4 𓂃 video

𓊆ྀི❤︎𓊇ྀི FLICH-BOT-MD 𓊆ྀི❤︎𓊇ྀི`;

      const payload = {
        footer: '🌸 FLICH-BOT-MD 🌸',
        buttons: [
          {
            buttonId: 'play_select_open',
            buttonText: { displayText: '☷ ELEGIR CANCION' },
            type: 4,
            nativeFlowInfo: {
              name: 'single_select',
              paramsJson: JSON.stringify({
                title: '𓊆ྀི FLICH-BOT SELECTION 𓊇ྀི',
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
        await react(client, m, '✅');
      } catch {
        await client.sendMessage(from, {
          text:
`𓊆ྀི❤︎𓊇ྀི FLICH - BOT - MD 𓊆ྀི❤︎𓊇ྀི

𓈈 Busqueda: *${query}*
𓈈 Toca una opcion para descargar *MP3* o *MP4*.

𓊆ྀི❤︎𓊇ྀི FLICH-BOT-MD 𓊆ྀི❤︎𓊇ྀི`,
          footer: '🌸 FLICH-BOT-MD 🌸',
          title: '𓊆ྀི Selector de canciones 𓊇ྀི',
          buttonText: '☷ Elegir cancion',
          sections: [
            { title: 'Descargar MP3', rows: rowsMp3.map((r) => ({ title: r.title, description: r.description, rowId: r.id })) },
            { title: 'Descargar MP4', rows: rowsMp4.map((r) => ({ title: r.title, description: r.description, rowId: r.id })) },
          ],
        }, { quoted: m });
        await react(client, m, '✅');
      }
    } catch (error) {
      await react(client, m, '❌');
      await client.sendMessage(from, { text: `Error en.play: ${String(error?.message || error)}` }, { quoted: m });
    }
  },
};