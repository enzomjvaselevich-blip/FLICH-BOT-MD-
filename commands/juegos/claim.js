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
  // IMPORTANTE: Usamos los mismos parámetros que rw.js
  run: async (sock, m, args, from) => {
    try {
      if (!global.db?.data) return await sock.sendMessage(from, { text: "Base de datos no cargada." }, { quoted: m });
      
      const db = global.db.data
      db.chats[from] = db.chats[from] || { users: {}, characters: {}, rolls: {} }
      const chat = db.chats[from]

      const quotedId = m.quoted?.id || m.message?.extendedTextMessage?.contextInfo?.stanzaId
      if (!quotedId || !chat.rolls[quotedId]) return await sock.sendMessage(from, { text: '⟡ Cita un personaje.' }, { quoted: m })

      const rollData = chat.rolls[quotedId]
      const structure = await loadCharacters()
      const sourceData = getCharacterById(rollData.id, structure)

      if (!sourceData) return await sock.sendMessage(from, { text: '⟡ Personaje no encontrado.' }, { quoted: m })
      
      chat.characters[rollData.id] = chat.characters[rollData.id] || {}
      if (chat.characters[rollData.id].user) return await sock.sendMessage(from, { text: `⟡ Ya tiene dueño.` }, { quoted: m })

      chat.characters[rollData.id] = { user: m.sender, name: sourceData.name }
      chat.rolls[quotedId].claimed = true

      await sock.sendMessage(from, { text: `⟡ *${sourceData.name}* reclamado.` }, { quoted: m })
    } catch (e) {
      console.error(e);
      await sock.sendMessage(from, { text: `> Error: ${e.message}` }, { quoted: m })
    }
  }
}
