export default {
  command: ['claim', 'c', 'reclamar'],
  category: 'juegos',
  run: async (sock, m, args, from, isOwner, { prefix }) => {
    // 1. Verificación básica
    if (!global.db?.data?.chats) {
        return await sock.sendMessage(from, { text: '❌ Base de datos no inicializada.' }, { quoted: m });
    }

    // Asegurar estructura
    global.db.data.chats[from] = global.db.data.chats[from] || { characters: {}, rolls: {} };
    const chat = global.db.data.chats[from];

    // 2. Obtener el ID citado
    const quoted = m.quoted ? m.quoted : (m.message?.extendedTextMessage?.contextInfo?.stanzaId ? { key: { id: m.message.extendedTextMessage.contextInfo.stanzaId } } : null);
    if (!quoted) return await sock.sendMessage(from, { text: '⟡ Debes CITAR el mensaje.' }, { quoted: m });

    const quotedId = quoted.key.id;

    // 3. Verificar si el personaje existe en la ruleta
    if (!chat.rolls || !chat.rolls[quotedId]) {
        return await sock.sendMessage(from, { text: '⟡ No encontré registro de este personaje.' }, { quoted: m });
    }

    if (chat.rolls[quotedId].claimed) {
        return await sock.sendMessage(from, { text: '⟡ Ya fue reclamado.' }, { quoted: m });
    }

    // 4. EL CAMBIO IMPORTANTE: Guardar en 'characters' para que topwaifu lo vea
    const charId = chat.rolls[quotedId].id;
    chat.characters = chat.characters || {};
    
    // Guardamos el personaje asociado al ID del reclamo
    chat.characters[quotedId] = { 
        id: charId, 
        user: m.sender, 
        timestamp: Date.now() 
    };
    
    chat.rolls[quotedId].claimed = true;

    // 5. Reacción y confirmación
    await sock.sendMessage(from, { react: { text: '✅', key: m.key } });
    await sock.sendMessage(from, { text: `⟡ ¡Has reclamado al personaje correctamente!` }, { quoted: m });
  }
}
