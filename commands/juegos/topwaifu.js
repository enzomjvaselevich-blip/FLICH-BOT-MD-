export default {
  command: ['topwaifu', 'top'],
  category: 'juegos',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      // 1. Acceso a la base de datos de forma segura
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

      // 3. Generación del texto plano con enlaces wa.me
      let txt = '🏆 *Top 10 Waifus Reclamadas* 🏆\n\n';
      ranking.forEach((u, i) => {
        const num = u.jid.split('@')[0];
        // Al usar wa.me/numero, el usuario puede hacer clic para abrir el chat.
        // ESTO EVITA que Baileys intente decodificar el JID y cause el crash.
        txt += `${i + 1}. wa.me/${num} ❯ *${u.count} personajes*\n`;
      });

      // 4. ENVÍO DIRECTO: Sin el campo 'mentions', la librería no hace crash.
      await client.sendMessage(m.chat, { text: txt }, { quoted: m });

    } catch (e) {
      console.error("Error capturado en topwaifu:", e);
    }
  }
}
