export default {
  command: ['topwaifu', 'top'],
  category: 'juegos',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      // 1. Acceso seguro a la DB
      const chat = global.db?.data?.chats?.[m.chat];
      if (!chat || !chat.users) {
        return await client.sendMessage(m.chat, { text: '❌ No hay datos de usuarios.' }, { quoted: m });
      }

      // 2. Procesar ranking: Convertimos a array y ordenamos
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

      // 3. Crear mensaje de texto (Sin menciones para evitar el crash)
      let txt = '🏆 *Top 10 Waifus Reclamadas* 🏆\n\n';
      ranking.forEach((item, index) => {
        const number = item.jid.split('@')[0];
        // Usamos wa.me para el link. Esto es clicable y NO hace crash
        txt += `${index + 1}. wa.me/${number} ❯ *${item.count} personajes*\n`;
      });

      // 4. Envío directo mediante sendMessage (evitando m.reply)
      await client.sendMessage(m.chat, { text: txt }, { quoted: m });

    } catch (e) {
      console.error("Error crítico en topwaifu:", e);
      // Fallback mínimo para no romper el flujo
      await client.sendMessage(m.chat, { text: '⚠️ Ocurrió un error al procesar el top.' }, { quoted: m });
    }
  }
}
