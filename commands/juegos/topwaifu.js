export default {
  command: ['topwaifu', 'top'],
  category: 'juegos',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      // 1. Acceso a la base de datos de forma segura
      const chat = global.db?.data?.chats?.[m.chat];
      if (!chat || !chat.users) {
        return await client.sendMessage(m.chat, { text: '❌ No hay datos de usuarios registrados.' }, { quoted: m });
      }

      // 2. Construcción del ranking filtrando solo los que tienen characters
      const ranking = Object.keys(chat.users)
        .map(jid => {
          const user = chat.users[jid];
          const count = Array.isArray(user?.characters) ? user.characters.length : 0;
          return { jid, count };
        })
        .filter(u => u.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      if (ranking.length === 0) {
        return await client.sendMessage(m.chat, { text: '⟡ No hay waifus reclamadas aún.' }, { quoted: m });
      }

      // 3. Formatear mensaje SIN MENCIONES
      // Usamos texto plano y links de wa.me para evitar el error de decodificación de la librería
      let txt = '🏆 *Top 10 Waifus Reclamadas* 🏆\n\n';
      
      ranking.forEach((item, index) => {
        const number = item.jid.split('@')[0];
        txt += `${index + 1}. wa.me/${number} ❯ *${item.count} personajes*\n`;
      });

      // 4. Envío directo usando el cliente (método nativo)
      // No incluimos 'mentions' aquí para evitar el error de destructuring
      await client.sendMessage(m.chat, { text: txt }, { quoted: m });

    } catch (e) {
      console.error("Error crítico en topwaifu:", e);
      await client.sendMessage(m.chat, { text: '⚠️ Ocurrió un error al procesar el top. Revisa la consola.' }, { quoted: m });
    }
  }
}
