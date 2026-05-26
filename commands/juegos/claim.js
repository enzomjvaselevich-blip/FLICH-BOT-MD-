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
  run: async (client, m, args, usedPrefix, command) => {
    try {
      // Protección: Verificar si global.db existe
      if (!global.db || !global.db.data) {
        return m.reply("⟡ La base de datos no está cargada. Espera un momento o reinicia el bot.")
      }
      
      const db = global.db.data
      db.chats = db.chats || {}
      db.chats[m.chat] = db.chats[m.chat] || { users: {}, characters: {}, rolls: {} }
      const chat = db.chats[m.chat]

      if (chat.adminonly || !chat.gacha) {
        return m.reply(`⟡ 𝗟𝗼𝘀 𝗰𝗼𝗺𝗮𝗻𝗱𝗼𝘀 𝗱𝗲 𝗚𝗮𝗰𝗵𝗮 𝗲𝘀𝘁𝗮́𝗻 𝗱𝗲𝘀𝗮𝗰𝘁𝗶𝘃𝗮𝗱𝗼𝘀.\n\n𝗨𝗻 𝗮𝗱𝗺𝗶𝗻𝗶𝘀𝘁𝗿𝗮𝗱𝗼𝗿 𝗽𝘂𝗲𝗱𝗲 𝗮𝗰𝘁𝗶𝘃𝗮𝗿𝗹𝗼𝘀 𝗰𝗼𝗻:\n- ${usedPrefix}gacha on`)
      }

      chat.users[m.sender] = chat.users[m.sender] || {}
      const me = chat.users[m.sender]
      const now = Date.now()
      const claimCooldown = 30 * 60 * 1000

      if (me.lastClaim && now < me.lastClaim) {
        const remaining = Math.ceil((me.lastClaim - now) / 1000)
        const minutes = Math.floor(remaining / 60)
        const seconds = remaining % 60
        return m.reply(`⟡ 𝗗𝗲𝗯𝗲𝘀 𝗲𝘀𝗽𝗲𝗿𝗮𝗿 *${minutes}m ${seconds}s* 𝗽𝗮𝗿𝗮 𝗿𝗲𝗰𝗹𝗮𝗺𝗮𝗿 𝗱𝗲 𝗻𝘂𝗲𝘃𝗼.`)
      }

      const quotedId = m.quoted?.id
      if (!quotedId || !chat.rolls[quotedId]) {
        return m.reply(`⟡ 𝗗𝗲𝗯𝗲𝘀 𝗰𝗶𝘁𝗮𝗿 𝘂𝗻 𝗽𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲 𝘃𝗮́𝗹𝗶𝗱𝗼 𝗽𝗮𝗿𝗮 𝗿𝗲𝗰𝗹𝗮𝗺𝗮𝗿.`)
      }

      const rollData = chat.rolls[quotedId]
      const id = rollData.id
      const structure = await loadCharacters()
      const sourceData = getCharacterById(id, structure)

      if (!sourceData) return m.reply('⟡ 𝗣𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲 𝗻𝗼 𝗲𝗻𝗰𝗼𝗻𝘁𝗿𝗮𝗱𝗼.')
      
      chat.characters[id] = chat.characters[id] || {}
      const record = chat.characters[id]

      if (record.user) {
        const ownerName = db.users?.[record.user]?.name || 'Usuario'
        return m.reply(`⟡ 𝗘𝗹 𝗽𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲 ${record.name || sourceData.name} 𝘆𝗮 𝗽𝗲𝗿𝘁𝗲𝗻𝗲𝗰𝗲 𝗮 ${ownerName}.`)
      }

      record.user = m.sender
      record.name = sourceData.name
      me.lastClaim = now + claimCooldown
      chat.rolls[quotedId].claimed = true

      await client.sendMessage(m.chat, { text: `⟡ *${record.name}* 𝗵𝗮 𝘀𝗶𝗱𝗼 𝗿𝗲𝗰𝗹𝗮𝗺𝗮𝗱𝗼 𝗽𝗼𝗿 *${m.pushName || 'Usuario'}*` }, { quoted: m })

    } catch (e) {
      console.error(e)
      return m.reply(`> Error al ejecutar *${usedPrefix + command}*:\n> ${e.message}`)
    }
  }
}
