export default {
  command: ['mywaifus', 'miswaifus', 'waifus'],
  category: 'gacha',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const chat = global.db?.data?.chats?.[m.chat];
      
      // 1. Verificación de seguridad
      if (!chat || !chat.users || !chat.users[m.sender]) {
        return m.reply('❌ No tienes personajes reclamados en este chat.');
      }

      const userCharacters = chat.users[m.sender].characters;
      if (!userCharacters || userCharacters.length === 0) {
        return m.reply('⟡ No tienes personajes reclamados todavía.');
      }

      // 2. Construcción de la lista de nombres
      // Buscamos el nombre en chat.characters usando el ID guardado
      let message = `⟡ *Tus personajes reclamados (${userCharacters.length}):*\n\n`;
      
      userCharacters.forEach((charId, index) => {
        // Obtenemos el nombre si existe, sino ponemos "Desconocido"
        const charName = chat.characters?.[charId]?.name || "Desconocido";
        message += `${index + 1}. *${charName}* (ID: ${charId})\n`;
      });

      // 3. Respuesta segura mediante m.reply
      await m.reply(message.trim());

    } catch (e) {
      console.error("Error en mywaifus:", e);
      return m.reply(`> Ocurrió un error al cargar tus personajes:\n> *${e.message}*`);
    }
  },
}
