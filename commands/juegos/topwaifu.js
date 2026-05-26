export default {
  command: ['topwaifu', 'top'],
  category: 'juegos',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const chat = global.db?.data?.chats?.[m.chat];
      if (!chat?.users) {
        return await client.sendMessage(m.chat, { text: '❌ No hay datos.' }, { quoted: m });
      }

      const ranking = Object.entries(chat.users)
        .map(([jid, u]) => ({ jid, count: u.characters?.length || 0 }))
        .filter(u => u.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      if (ranking.length === 0) return await client.sendMessage(m.chat, { text: '⟡ Vacío.' }, { quoted: m });

      let txt = '🏆 *Top 10 Waifus* 🏆\n\n';
      ranking.forEach((item, i) => {
        txt += `${i + 1}. wa.me/${item.jid.split('@')[0]} ❯ *${item.count}*\n`;
      });

      // ESTA ES LA CLAVE: Enviamos un mensaje simple.
      // NO estamos enviando un array de "mentions", por lo tanto
      // Baileys no intentará procesar usuarios ni hará destructuring.
      await client.sendMessage(m.chat, { 
        text: txt 
      }, { quoted: m });

    } catch (e) {
      console.error("Error en topwaifu:", e);
    }
  }
}
