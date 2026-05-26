import { promises as fs } from 'fs'

const charactersFilePath = './core/characters.json'

async function loadCharacters() {
  const data = await fs.readFile(charactersFilePath, 'utf-8')
  return JSON.parse(data)
}

function getCharacterById(id, structure) {
  return Object.values(structure).flatMap(s => s.characters).find(c => String(c.id) === String(id))
}

export default {
  command: ['claim', 'c', 'reclamar'],
  category: 'gacha',
  run: async (sock, m, args, from, isOwner, context) => {
    try {
      // Protección de DB
      if (!global.db || !global.db.data) return await sock.sendMessage(from, { text: "La base de datos no está lista." }, { quoted: m });
      
      const db = global.db.data
      db.chats = db.chats || {}
      db.chats[from] = db.chats[from] || { users: {}, characters: {}, rolls: {} }
      const chat = db.chats[from]

      const quotedId = m.quoted?.id || m.message?.extendedTextMessage?.contextInfo?.stanzaId
      if (!quotedId || !chat.rolls[quotedId]) {
        return await sock.sendMessage(from, { text: '⟡ Debes citar un personaje válido.' }, { quoted: m })
      }

      const rollData = chat.rolls[quotedId]
      const structure = await loadCharacters()
      const sourceData = getCharacterById(rollData.id, structure)

      if (!sourceData) return await sock.sendMessage(from, { text: '⟡ Personaje no encontrado.' }, { quoted: m })
      
      chat.characters[rollData.id] = chat.characters[rollData.id] || {}
      if (chat.characters[rollData.id].user) return await sock.sendMessage(from, { text: `⟡ Ya pertenece a alguien.` }, { quoted: m })

      chat.characters[rollData.id] = { user: m.sender, name: sourceData.name }
      chat.rolls[quotedId].claimed = true

      await sock.sendMessage(from, { text: `⟡ *${sourceData.name}* ha sido reclamado.` }, { quoted: m })
    } catch (e) {
      await sock.sendMessage(from, { text: `> Error: ${e.message}` }, { quoted: m })
    }
  }
}
