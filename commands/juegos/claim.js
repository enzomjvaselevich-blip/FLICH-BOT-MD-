import { promises as fs } from 'fs'

const charactersFilePath = './core/characters.json'

async function loadCharacters() {
  try {
    const data = await fs.readFile(charactersFilePath, 'utf-8')
    return JSON.parse(data)
  } catch (e) { return {} }
}

function getCharacterById(id, structure) {
  return Object.values(structure).flatMap(s => s.characters).find(c => String(c.id) === String(id))
}

export default {
  command: ['claim', 'c', 'reclamar'],
  category: 'gacha',
  run: async (sock, m, args, from, isOwner, context) => {
    // Si global.db.data no existe, lo inicializamos en el momento
    if (!global.db) global.db = { data: { chats: {} } };
    if (!global.db.data) global.db.data = { chats: {} };
    
    const db = global.db.data;
    db.chats[from] = db.chats[from] || { users: {}, characters: {}, rolls: {} };
    const chat = db.chats[from];

    const quotedId = m.quoted?.id || m.message?.extendedTextMessage?.contextInfo?.stanzaId;
    if (!quotedId || !chat.rolls?.[quotedId]) {
      return await sock.sendMessage(from, { text: '⟡ Cita un personaje para reclamar.' }, { quoted: m });
    }

    if (chat.rolls[quotedId].claimed) {
      return await sock.sendMessage(from, { text: '⟡ Ya fue reclamado.' }, { quoted: m });
    }

    const structure = await loadCharacters();
    const sourceData = getCharacterById(chat.rolls[quotedId].id, structure);

    if (!sourceData) return await sock.sendMessage(from, { text: '⟡ No encontrado.' }, { quoted: m });
    
    chat.characters = chat.characters || {};
    chat.characters[chat.rolls[quotedId].id] = { user: m.sender, name: sourceData.name };
    chat.rolls[quotedId].claimed = true;

    await sock.sendMessage(from, { text: `⟡ *${sourceData.name}* reclamado por ${m.pushName || 'ti'}.` }, { quoted: m });
  }
}
