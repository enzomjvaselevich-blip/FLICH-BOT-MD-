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
  run: async (sock, m, args, from, isOwner, context) => { // Ajustado a los parámetros que usa tu bot
    try {
      const db = global.db.data
      const chat = db.chats[from]
      chat.users ||= {}
      chat.characters ||= {}
      chat.rolls ||= {}

      if (chat.adminonly || !chat.gacha) {
        return await sock.sendMessage(from, { text: '⟡ Los comandos de Gacha están desactivados.' }, { quoted: m })
      }

      const quotedId = m.quoted?.id || m.message?.extendedTextMessage?.contextInfo?.stanzaId
      if (!quotedId || !chat.rolls[quotedId]) {
        return await sock.sendMessage(from, { text: '⟡ Debes citar un personaje válido para reclamar.' }, { quoted: m })
      }

      const rollData = chat.rolls[quotedId]
      const structure = await loadCharacters()
      const sourceData = getCharacterById(rollData.id, structure)

      if (!sourceData) return await sock.sendMessage(from, { text: '⟡ Personaje no encontrado.' }, { quoted: m })
      
      const record = chat.characters[rollData.id] || {}
      if (record.user) return await sock.sendMessage(from, { text: `⟡ Ya pertenece a otro usuario.` }, { quoted: m })

      chat.characters[rollData.id] = { user: m.sender, name: sourceData.name }
      chat.rolls[quotedId].claimed = true

      await sock.sendMessage(from, { text: `⟡ *${sourceData.name}* ha sido reclamado por *${m.pushName || 'Usuario'}*` }, { quoted: m })
    } catch (e) {
      await sock.sendMessage(from, { text: `> Error: ${e.message}` }, { quoted: m })
    }
  }
}
