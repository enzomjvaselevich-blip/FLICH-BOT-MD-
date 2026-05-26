export default {
  command: ['topwaifus', 'wtop', 'topreclamados'],
  category: 'gacha',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const chat = global.db.data.chats[m.chat];
      if (!chat || !chat.users || Object.keys(chat.users).length === 0) {
        return await client.sendMessage(m.chat, { text: '⟡ No hay usuarios con personajes reclamados en este chat.' }, { quoted: m });
      }

      // 1. Convertir usuarios a una lista para ordenar
      const ranking = Object.entries(chat.users).map(([jid, data]) => ({
        jid,
        count: Array.isArray(data.characters) ? data.characters.length : 0
      })).filter(u => u.count > 0);

      if (ranking.length === 0) {
        return await client.sendMessage(m.chat, { text: '⟡ No hay personajes reclamados para mostrar.' }, { quoted: m });
      }

      // 2. Lógica de Paginación
      const page = parseInt(args[0]) || 1;
      const perPage = 10;
      const totalPages = Math.ceil(ranking.length / perPage);

      if (page < 1 || page > totalPages) {
        return await client.sendMessage(m.chat, { text: `⟡ Página no válida. Hay un total de ${totalPages} páginas.` }, { quoted: m });
      }

      // 3. Ordenar y Slicing
      const sorted = ranking.sort((a, b) => b.count - a.count);
      const sliced = sorted.slice((page - 1) * perPage, page * perPage);

      // 4. Construcción del mensaje
      let message = '🏆 *Top Usuarios con más Waifus* 🏆\n\n';
      sliced.forEach((u, i) => {
        const number = u.jid.split('@')[0];
        message += `#${((page - 1) * perPage) + i + 1} ❯ wa.me/${number}\n`;
        message += `- Reclamadas ❯ *${u.count}*\n\n`;
      });

      message += `> Página ${page} de ${totalPages}`;
      if (page < totalPages) {
        message += `\n> Usa: ${usedPrefix}${command} ${page + 1} para ver más.`;
      }

      await client.sendMessage(m.chat, { text: message.trim() }, { quoted: m });

    } catch (e) {
      console.error(e);
      return await client.sendMessage(m.chat, { 
        text: `> Ocurrió un error inesperado al ejecutar *${usedPrefix + command}*.\n> [Error: *${e.message}*]` 
      }, { quoted: m });
    }
  },
}
