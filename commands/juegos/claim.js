export default {
  command: ['claim', 'c', 'reclamar'],
  category: 'juegos',
  run: async (sock, m, args, from, isOwner, { prefix }) => {
    // 1. Verificar si la base de datos existe
    if (!global.db || !global.db.data) {
        return await sock.sendMessage(from, { text: '❌ Base de datos no cargada, reiniciando...' }, { quoted: m });
    }

    // 2. Intentar obtener el ID del mensaje citado
    const quoted = m.quoted ? m.quoted : (m.message?.extendedTextMessage?.contextInfo?.stanzaId ? { key: { id: m.message.extendedTextMessage.contextInfo.stanzaId } } : null);

    if (!quoted) {
        return await sock.sendMessage(from, { text: '⟡ Debes CITAR el mensaje del personaje que quieres reclamar.' }, { quoted: m });
    }

    const quotedId = quoted.key.id;

    // 3. Verificar si el bot tiene registro de esa ruleta
    const chat = global.db.data.chats[from] || {};
    if (!chat.rolls || !chat.rolls[quotedId]) {
        return await sock.sendMessage(from, { text: '⟡ No encontré registro de este personaje en mis datos recientes.' }, { quoted: m });
    }

    // 4. Lógica de reclamo
    if (chat.rolls[quotedId].claimed) {
        return await sock.sendMessage(from, { text: '⟡ Este personaje ya fue reclamado.' }, { quoted: m });
    }

    // Marcar como reclamado
    chat.rolls[quotedId].claimed = true;
    
    // 5. Reaccionar con el emoji ✅
    await sock.sendMessage(from, {
        react: {
            text: '✅',
            key: m.key
        }
    });
    
    await sock.sendMessage(from, { 
        text: `⟡ ¡Has reclamado al personaje correctamente!`, 
        mentions: [m.sender] 
    }, { quoted: m });
  }
}
