import { promises as fs } from 'fs'

const charactersFilePath = './core/characters.json'

async function loadCharacters() {
  const data = await fs.readFile(charactersFilePath, 'utf-8')
  return JSON.parse(data)
}

function getCharacterById(id, structure) {
  // Ajuste para buscar en el objeto de categorías del JSON
  return Object.values(structure).flatMap(s => s.characters).find(c => String(c.id) === String(id))
}

export default {
  name: 'claim',
  command: ['claim', 'c', 'reclamar'],
  category: 'gacha',
  isOwner: false,
  group: true,
  admin: false,
  run: async (sock, m, args, from, isOwner, context) => {
    try {
      // 1. Verificación segura de la base de datos
      if (!global.db || !global.db.data) {
        return await sock.sendMessage(from, { text: '⟡ Error: La base de datos no está cargada.' }, { quoted: m });
      }

      const db = global.db.data;
      db.chats = db.chats || {};
      db.chats[from] = db.chats[from] || { users: {}, characters: {}, rolls: {} };
      const chat = db.chats[from];

      // 2. Obtener el ID del mensaje citado (asegurando compatibilidad)
      const quotedId = m.quoted?.id || m.message?.extendedTextMessage?.contextInfo?.stanzaId;
      
      if (!quotedId || !chat.rolls[quotedId]) {
        return await sock.sendMessage(from, { text: '⟡ Debes citar un mensaje de personaje válido para reclamar.' }, { quoted: m });
      }

      const rollData = chat.rolls[quotedId];
      if (rollData.claimed) {
          return await sock.sendMessage(from, { text: '⟡ Este personaje ya fue reclamado anteriormente.' }, { quoted: m });
      }

      const structure = await loadCharacters();
      const sourceData = getCharacterById(rollData.id, structure);

      if (!sourceData) return await sock.sendMessage(from, { text: '⟡ Personaje no encontrado en la base de datos.' }, { quoted: m });
      
      // 3. Inicializar estructura si no existe
      chat.characters = chat.characters || {};
      chat.characters[rollData.id] = chat.characters[rollData.id] || {};
      
      const record = chat.characters[rollData.id];

      // 4. Verificar si ya tiene dueño
      if (record.user) {
        const ownerName = db.users?.[record.user]?.name || 'Usuario';
        return await sock.sendMessage(from, { text: `⟡ El personaje ${record.name || sourceData.name} ya pertenece a ${ownerName}.` }, { quoted: m });
      }

      // 5. Asignación
      record.user = m.sender;
      record.name = sourceData.name;
      chat.rolls[quotedId].claimed = true;

      await sock.sendMessage(from, { text: `⟡ *${record.name}* ha sido reclamado con éxito por *${m.pushName || 'Usuario'}*.` }, { quoted: m });

    } catch (e) {
      console.error(e);
      await sock.sendMessage(from, { text: `> Ocurrió un error al reclamar:\n> ${e.message}` }, { quoted: m });
    }
  }
}
