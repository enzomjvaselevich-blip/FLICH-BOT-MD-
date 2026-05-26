export default {
  command: ['topwaifus', 'wtop', 'topreclamados'],
  category: 'gacha',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const chat = global.db?.data?.chats?.[m.chat];
      
      // Verificación de existencia de datos
      if (!chat || !chat.users || Object.keys(chat.users).length === 0) {
        return m.reply('⟡ No hay usuarios con personajes reclamados en este chat.');
      }

      // 1. Mapeo de datos: evitamos cualquier destructuring complejo
      const ranking = [];
      for (const jid in chat.users) {
        const charList = chat.users[jid]?.characters;
        ranking.push({
          jid: jid,
          count: Array.isArray(charList) ? charList.length : 0
        });
      }

      // Filtrar solo los que tengan waifus
      const activeRanking = ranking.filter(u => u.count > 0);
      if (activeRanking.length === 0) {
        return m.reply('⟡ No hay personajes reclamados para mostrar.');
      }

      // 2. Ordenar por cantidad
      activeRanking.sort((a, b) => b.count - a.count);

      // 3. Paginación
      const page = parseInt(args[0]) || 1;
      const perPage = 10;
      const totalPages = Math.ceil(activeRanking.length / perPage);

      if (page < 1 || page > totalPages) {
        return m.reply(`⟡ Página no válida. Hay un total de ${totalPages} páginas.`);
      }

      const sliced = activeRanking.slice((page - 1) * perPage, page * perPage);

      // 4. Construcción del mensaje (Formato seguro)
      let message = '🏆 *Top Usuarios con más Waifus* 🏆\n\n';
      sliced.forEach((u, i) => {
        const number = u.jid.split('@')[0];
        // Usamos wa.me para el link y así evitamos menciones que causan el crash
        message += `#${((page - 1) * perPage) + i + 1} ❯ wa.me/${number}\n`;
        message += `- Reclamadas ❯ *${u.count}*\n\n`;
      });

      message += `> Página ${page} de ${totalPages}`;
      if (page < totalPages) {
        message += `\n> Usa: ${usedPrefix}${command} ${page + 1} para ver más.`;
      }

      // 5. RESPUESTA SEGURA: Usamos m.reply en lugar de client.sendMessage
      // Esto evita que fsociety-Baileys intente procesar JIDs internos
      await m.reply(message.trim());

    } catch (e) {
      console.error("Error en comando top:", e);
      return m.reply(`> Error al procesar el top:\n> *${e.message}*`);
    }
  },
}
