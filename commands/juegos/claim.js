export default {
  command: ['claim', 'c', 'reclamar'],
  category: 'juegos',
  run: async (client, m, args, usedPrefix, command) => {
    // 1. Validar base de datos
    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = { users: {}, rolls: {} };
    const chat = global.db.data.chats[m.chat];

    // 2. Obtener el mensaje citado
    const quotedId = m.quoted ? m.quoted.id : m.message?.extendedTextMessage?.contextInfo?.stanzaId;
    if (!quotedId) return m.reply('⟡ Cita el mensaje del personaje para reclamarlo.');

    // 3. Verificar si existe en la ruleta
    if (!chat.rolls || !chat.rolls[quotedId]) return m.reply('⟡ No encontré registro de este personaje.');
    if (chat.rolls[quotedId].claimed) return m.reply('⟡ Ya fue reclamado.');

    // 4. Guardar personaje en la estructura del usuario (Compatible con robwaifu.js)
    if (!chat.users[m.sender]) chat.users[m.sender] = { characters: [] };
    
    const charId = chat.rolls[quotedId].id;
    chat.users[m.sender].characters.push(charId); // Aquí se guarda el personaje
    
    chat.rolls[quotedId].claimed = true;

    await m.reply('⟡ ¡Has reclamado al personaje correctamente!');
  }
}
