import fs from 'fs';
import path from 'path';

export default {
  command: ['claim', 'c', 'reclamar'],
  category: 'juegos',
  run: async (sock, m, args, from, isOwner, { prefix }) => {
    try {
      // 1. Asegurar carpeta de respaldo
      const WAIFUS_DIR = path.join(process.cwd(), 'waifus_guardados');
      if (!fs.existsSync(WAIFUS_DIR)) fs.mkdirSync(WAIFUS_DIR, { recursive: true });

      // 2. Validar DB
      if (!global.db?.data?.chats) {
        return await sock.sendMessage(from, { text: '❌ Base de datos no inicializada.' }, { quoted: m });
      }

      global.db.data.chats[from] = global.db.data.chats[from] || { users: {}, characters: {}, rolls: {} };
      const chat = global.db.data.chats[from];

      // 3. Obtener el ID citado
      const quoted = m.quoted ? m.quoted : (m.message?.extendedTextMessage?.contextInfo?.stanzaId ? { key: { id: m.message.extendedTextMessage.contextInfo.stanzaId } } : null);
      if (!quoted) {
        return await sock.sendMessage(from, { text: '⟡ Debes CITAR el mensaje del personaje.' }, { quoted: m });
      }

      const quotedId = quoted.key.id;
      if (!chat.rolls?.[quotedId]) {
        return await sock.sendMessage(from, { text: '⟡ No encontré registro de este personaje.' }, { quoted: m });
      }

      if (chat.rolls[quotedId].claimed) {
        return await sock.sendMessage(from, { text: '⟡ Ya fue reclamado.' }, { quoted: m });
      }

      // 4. Guardar en Global DB
      const charId = chat.rolls[quotedId].id;
      chat.users = chat.users || {};
      chat.users[m.sender] = chat.users[m.sender] || { characters: [] };
      chat.users[m.sender].characters.push(charId);
      chat.rolls[quotedId].claimed = true;

      // 5. GUARDADO PERSISTENTE EN CARPETA (waifus_guardados)
      const userId = m.sender.split('@')[0];
      const userFile = path.join(WAIFUS_DIR, `${userId}.json`);
      let userData = fs.existsSync(userFile) ? JSON.parse(fs.readFileSync(userFile, 'utf8')) : { jid: m.sender, waifus: [] };
      
      userData.waifus.push({
        id: charId,
        name: chat.rolls[quotedId].name || "Desconocido",
        timestamp: new Date().toISOString()
      });
      
      fs.writeFileSync(userFile, JSON.stringify(userData, null, 2));

      // 6. Respuesta
      await sock.sendMessage(from, { react: { text: '✅', key: m.key } });
      await sock.sendMessage(from, { text: `⟡ ¡Has reclamado a ${chat.rolls[quotedId].name || 'un personaje'} correctamente!` }, { quoted: m });

    } catch (e) {
      console.error("Error en claim.js:", e);
      await sock.sendMessage(from, { text: `> Error al reclamar: *${e.message}*` }, { quoted: m });
    }
  }
}
