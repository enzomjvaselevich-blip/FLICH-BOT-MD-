import { promises as fs } from 'fs'

const charactersFilePath = './core/characters.json'

async function loadCharacters() {
  try {
    const data = await fs.readFile(charactersFilePath, 'utf-8')
    return JSON.parse(data)
  } catch (e) {
    return {}
  }
}

function getCharacterById(id, structure) {
  return Object.values(structure).flatMap(s => s.characters).find(c => String(c.id) === String(id))
}

export default {
  command: ['claim', 'c', 'reclamar'],
  category: 'gacha',
  run: async (sock, m, args, from) => {
    try {
      // Verificación estricta de la base de datos
      if (!global.db || !global.db.data) {
        return await sock.sendMessage(from, { text: '⟡ La base de datos no está lista. Intenta de nuevo en unos segundos.' }, { quoted: m });
      }
      
      const db = global.db.data;
      db.chats = db.chats || {};
      db.chats[from] = db.chats[from] || { users: {}, characters: {}, rolls: {} };
      const chat = db.chats[from];

      const quotedId = m.quoted?.id || m.message?.extendedTextMessage?.contextInfo?.stanzaId;
      if (!quotedId || !chat.rolls[quotedId]) {
        return await sock.sendMessage(from, { text: '⟡ Cita el mensaje del personaje que quieres reclamar.' }, { quoted: m });
      }

      const rollData = chat.rolls[quotedId];
      if (rollData.claimed) {
        return await sock.sendMessage(from, { text: '⟡ Este personaje ya fue reclamado.' }, { quoted: m });
      }

      const structure = await loadCharacters();
      const sourceData = getCharacterById(rollData.id, structure);

      if (!sourceData) return await sock.sendMessage(from, { text: '⟡ Personaje no encontrado.' }, { quoted: m });
      
      chat.characters = chat.characters || {};
      
      // Reclamo exitoso directo (Gratis)
      chat.characters[rollData.id] = { user: m.sender, name: sourceData.name };
      chat.rolls[quotedId].claimed = true;

      await sock.sendMessage(from, { text: `⟡ *${sourceData.name}* ha sido reclamado exitosamente por ${m.pushName || 'ti'}.` }, { quoted: m });
    } catch (e) {
      console.error(e);
      await sock.sendMessage(from, { text: `⟡ Error interno al reclamar: ${e.message}` }, { quoted: m });
    }
  }
}
