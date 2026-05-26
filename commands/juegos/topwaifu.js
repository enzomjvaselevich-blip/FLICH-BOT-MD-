export default {
  command: ['topwaifu', 'top'],
  category: 'juegos',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      // 1. Acceso seguro
      const chat = global.db?.data?.chats?.[m.chat];
      if (!chat?.users) return;

      // 2. Ranking
      const ranking = Object.entries(chat.users)
        .map(([jid, data]) => ({
          jid: jid,
          count: Array.isArray(data.characters) ? data.characters.length : 0
        }))
        .filter(u => u.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      if (ranking.length === 0) return;

      // 3. Texto plano puro (sin menciones ni lógica de librería)
      let txt = '🏆 *Top 10 Waifus Reclamadas* 🏆\n\n';
      ranking.forEach((u, i) => {
        const num = u.jid.split('@')[0];
        txt += `${i + 1}. wa.me/${num} ❯ *${u.count}*\n`;
      });

      // 4. ENVÍO SIN 'QUOTED' Y SIN 'MENTIONS'
      // Al quitar 'quoted: m', evitamos que la librería intente leer un objeto 
      // que causa el error de destructuring.
      await client.sendMessage(m.chat, { text: txt });

    } catch (e) {
      console.error("Error bypass aplicado:", e);
    }
  }
}
