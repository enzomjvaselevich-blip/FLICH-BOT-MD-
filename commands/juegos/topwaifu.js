export default {
  command: ['topwaifu', 'top'],
  category: 'juegos',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      // 1. Acceso seguro a la base de datos
      const chat = global.db?.data?.chats?.[m.chat];
      if (!chat || !chat.users) {
        return await client.sendMessage(m.chat, { text: '❌ No hay datos de usuarios.' }, { quoted: m });
      }

      // 2. Construcción del ranking (Solo IDs y conteo)
      const ranking = [];
      for (const jid in chat.users) {
        const count = chat.users[jid]?.characters?.length || 0;
        if (count > 0) {
          ranking.push({ jid, count });
        }
      }

      if (ranking.length === 0) {
        return await client.sendMessage(m.chat, { text: '⟡ No hay waifus reclamadas.' }, { quoted: m });
      }

      // 3. Ordenar por cantidad
      ranking.sort((a, b) => b.count - a.count);
      const top10 = ranking.slice(0, 10);

      // 4. Formatear mensaje SIN usar 'mentions' para evitar el crash
      let txt = '🏆 *Top más reclamados de waifus* 🏆\n\n';
      
      top10.forEach((item, index) => {
        const number = item.jid.split('@')[0];
        // Usamos wa.me para el link y así evitamos menciones que causan el crash
        txt += `${index + 1}. wa.me/${number} ❯ *${item.count}*\n`;
      });

      // 5. Envío directo usando el cliente (método nativo)
      await client.sendMessage(m.chat, { text: txt }, { quoted: m });

    } catch (e) {
      console.error("Error en topwaifu:", e);
      await client.sendMessage(m.chat, { text: '⚠️ Ocurrió un error al procesar el top.' }, { quoted: m });
    }
  }
}
