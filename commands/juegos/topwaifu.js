export default {
  command: ['topwaifu', 'top'],
  category: 'juegos',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      // 1. Acceso seguro a la base de datos
      const chat = global.db?.data?.chats?.[m.chat];
      if (!chat?.users) {
        return await client.sendMessage(m.chat, { text: '❌ No hay registros de usuarios.' }, { quoted: m });
      }

      // 2. Procesamiento del top
      const ranking = Object.entries(chat.users)
        .map(([jid, data]) => ({
          jid: jid,
          count: Array.isArray(data.characters) ? data.characters.length : 0
        }))
        .filter(u => u.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      if (ranking.length === 0) {
        return await client.sendMessage(m.chat, { text: '⟡ No hay waifus reclamadas.' }, { quoted: m });
      }

      // 3. Generación del texto plano
      let txt = '🏆 *Top 10 Waifus Reclamadas* 🏆\n\n';
      ranking.forEach((u, i) => {
        const num = u.jid.split('@')[0];
        txt += `${i + 1}. wa.me/${num} ❯ *${u.count} personajes*\n`;
      });

      // 4. ENVÍO DE BAJO NIVEL (Esto no usa menciones, por tanto no hace crash)
      await client.sendMessage(m.chat, { text: txt }, { quoted: m });

    } catch (e) {
      console.error("Error capturado:", e);
      // Fallback para evitar bloqueo del bot
    }
  }
}
