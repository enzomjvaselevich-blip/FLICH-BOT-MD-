export default {
  command: ['topwaifu', 'top'],
  category: 'juegos',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      // 1. Obtener base de datos de forma segura
      const chat = global.db?.data?.chats?.[m.chat];
      if (!chat || !chat.users) {
        return await client.sendMessage(m.chat, { text: '❌ No hay registros de usuarios en este grupo.' }, { quoted: m });
      }

      // 2. Procesar ranking sin usar funciones complejas
      const ranking = Object.keys(chat.users)
        .map(jid => ({
          jid: jid,
          count: Array.isArray(chat.users[jid]?.characters) ? chat.users[jid].characters.length : 0
        }))
        .filter(u => u.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      if (ranking.length === 0) {
        return await client.sendMessage(m.chat, { text: '⟡ No hay waifus reclamadas todavía.' }, { quoted: m });
      }

      // 3. Crear el mensaje de texto puro (sin menciones = sin crash)
      let txt = '🏆 *Top 10 Waifus Reclamadas* 🏆\n\n';
      ranking.forEach((u, i) => {
        const num = u.jid.split('@')[0];
        txt += `${i + 1}. wa.me/${num} ❯ *${u.count} personajes*\n`;
      });

      // 4. Envío directo mediante sendMessage (evitando lógica de m.reply)
      await client.sendMessage(m.chat, { text: txt }, { quoted: m });

    } catch (e) {
      console.error("Error crítico en topwaifu:", e);
      // Fallback simple para evitar que la consola se inunde de errores
      await client.sendMessage(m.chat, { text: '⚠️ Error al cargar el top.' }, { quoted: m });
    }
  }
}
