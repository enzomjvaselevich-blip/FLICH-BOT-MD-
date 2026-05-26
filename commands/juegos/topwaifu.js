export default {
  command: ['mywaifus', 'miswaifus', 'waifus'],
  category: 'gacha',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      // 1. Acceso seguro a la base de datos
      const chat = global.db?.data?.chats?.[m.chat];
      
      // 2. Verificación de existencia
      if (!chat || !chat.users || !chat.users[m.sender]) {
        return await client.sendMessage(m.chat, { text: '❌ No tienes personajes reclamados en este chat.' }, { quoted: m });
      }

      const userCharacters = chat.users[m.sender].characters;
      if (!userCharacters || userCharacters.length === 0) {
        return await client.sendMessage(m.chat, { text: '⟡ No tienes personajes reclamados todavía.' }, { quoted: m });
      }

      // 3. Construcción del mensaje (sin menciones para evitar el crash)
      let message = `⟡ *Tus personajes reclamados (${userCharacters.length}):*\n\n`;
      
      userCharacters.forEach((charId, index) => {
        const charName = chat.characters?.[charId]?.name || "Desconocido";
        message += `${index + 1}. *${charName}* (ID: ${charId})\n`;
      });

      // 4. ENVÍO SEGURO: Usamos client.sendMessage en lugar de m.reply
      // No incluimos el campo 'mentions' para evitar el TypeError de destructuring
      await client.sendMessage(m.chat, { text: message.trim() }, { quoted: m });

    } catch (e) {
      console.error("Error en mywaifus:", e);
      // Fallback por si client.sendMessage también falla
      await client.sendMessage(m.chat, { text: `> Ocurrió un error al cargar tus personajes:\n> *${e.message}*` }, { quoted: m });
    }
  },
}
