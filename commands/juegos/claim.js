export default {
  command: ['claim', 'c', 'reclamar'],
  category: 'juegos',
  run: async (sock, m, args, from, isOwner, { prefix }) => {
    try {
      if (!global.db?.data?.chats) return;
      
      const chat = global.db.data.chats[from] = global.db.data.chats[from] || { users: {}, characters: {}, rolls: {} };
      
      // Asegurar sender
      const sender = m.sender || 'unknown';
      
      const quoted = m.quoted ? m.quoted : (m.message?.extendedTextMessage?.contextInfo?.stanzaId ? { key: { id: m.message.extendedTextMessage.contextInfo.stanzaId } } : null);
      if (!quoted) return await sock.sendMessage(from, { text: '⟡ Cita el mensaje.' });

      const quotedId = quoted.key.id;
      if (!chat.rolls?.[quotedId]) return await sock.sendMessage(from, { text: '⟡ No encontrado.' });
      if (chat.rolls[quotedId].claimed) return await sock.sendMessage(from, { text: '⟡ Ya reclamado.' });

      // Guardar en memoria
      const charId = chat.rolls[quotedId].id;
      chat.users[sender] = chat.users[sender] || { characters: [] };
      chat.users[sender].characters.push(charId);
      chat.rolls[quotedId].claimed = true;

      // Guardar en archivo (waifus_guardados)
      const fs = require('fs');
      const path = require('path');
      const dir = path.join(process.cwd(), 'waifus_guardados');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const file = path.join(dir, `${sender.split('@')[0]}.json`);
      let data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { waifus: [] };
      data.waifus.push({ id: charId, name: chat.rolls[quotedId].name });
      fs.writeFileSync(file, JSON.stringify(data, null, 2));

      await sock.sendMessage(from, { text: '✅ Reclamado!' });
    } catch (e) {
      console.error(e);
    }
  }
}
