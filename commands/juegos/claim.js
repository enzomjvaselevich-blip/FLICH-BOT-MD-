export default {
  command: ['claim', 'c', 'reclamar'],
  category: 'juegos',
  run: async (sock, m, args, from, isOwner, { prefix }) => {
    if (!global.db?.data?.chats) return await sock.sendMessage(from, { text: '❌ Base de datos no inicializada.' }, { quoted: m });

    global.db.data.chats[from] = global.db.data.chats[from] || { characters: {}, rolls: {} };
    const chat = global.db.data.chats[from];

    const quoted = m.quoted ? m.quoted : (m.message?.extendedTextMessage?.contextInfo?.stanzaId ? { key: { id: m.message.extendedTextMessage.contextInfo.stanzaId } } : null);
    if (!quoted) return await sock.sendMessage(from, { text: '⟡ Debes CITAR el mensaje.' }, { quoted: m });

    const quotedId = quoted.key.id;

    if (!chat.rolls || !chat.rolls[quotedId]) {
        return await sock.sendMessage(from, { text: '⟡ No encontré registro de este personaje.' }, { quoted: m });
    }

    if (chat.rolls[quotedId].claimed) {
        return await sock.sendMessage(from, { text: '⟡ Ya fue reclamado.' }, { quoted: m });
    }

    const charId = chat.rolls[quotedId].id;
    
    // GUARDADO DIRECTO PARA EL TOP
    chat.characters = chat.characters || {};
    chat.characters[charId] = { 
        user: m.sender, 
        timestamp: Date.now() 
    };
    
    chat.rolls[quotedId].claimed = true;

    await sock.sendMessage(from, { react: { text: '✅', key: m.key } });
    await sock.sendMessage(from, { text: `⟡ ¡Has reclamado al personaje correctamente!` }, { quoted: m });
  }
}
