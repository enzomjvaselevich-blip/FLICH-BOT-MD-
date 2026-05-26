export default {
  command: ['claim', 'c', 'reclamar'],
  category: 'juegos',
  run: async (sock, m, args, from, isOwner, { prefix }) => {
    // 1. Validar DB
    if (!global.db?.data?.chats) return await sock.sendMessage(from, { text: '❌ Base de datos no inicializada.' }, { quoted: m });

    global.db.data.chats[from] = global.db.data.chats[from] || { users: {}, characters: {}, rolls: {} };
    const chat = global.db.data.chats[from];

    // 2. Obtener el ID citado
    const quoted = m.quoted ? m.quoted : (m.message?.extendedTextMessage?.contextInfo?.stanzaId ? { key: { id: m.message.extendedTextMessage.contextInfo.stanzaId } } : null);
    if (!quoted) return await sock.sendMessage(from, { text: '⟡ Debes CITAR el mensaje del personaje.' }, { quoted: m });

    const quotedId = quoted.key.id;

    if (!chat.rolls || !chat.rolls[quotedId]) {
        return await sock.sendMessage(from, { text: '⟡ No encontré registro de este personaje.' }, { quoted: m });
    }

    if (chat.rolls[quotedId].claimed) {
        return await sock.sendMessage(from, { text: '⟡ Ya fue reclamado.' }, { quoted: m });
    }

    // 3. Guardado en la estructura que usa robwaifu
    const charId = chat.rolls[quotedId].id;
    
    // Asegurar usuario en DB
    chat.users = chat.users || {};
    chat.users[m.sender] = chat.users[m.sender] || { characters: [] };
    
    // Guardar ID en la lista del usuario
    chat.users[m.sender].characters.push(charId);
    
    // Guardar info general del personaje si no existe
    chat.characters = chat.characters || {};
    if (!chat.characters[charId]) {
        chat.characters[charId] = { name: chat.rolls[quotedId].name || "Desconocido" };
    }

    chat.rolls[quotedId].claimed = true;

    await sock.sendMessage(from, { react: { text: '✅', key: m.key } });
    await sock.sendMessage(from, { text: `⟡ ¡Has reclamado al personaje correctamente!` }, { quoted: m });
  }
}
