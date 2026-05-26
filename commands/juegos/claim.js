import { promises as fs } from 'fs'

const charactersFilePath = './core/characters.json'

async function loadCharacters() {
  try {
    const data = await fs.readFile(charactersFilePath, 'utf-8')
    return JSON.parse(data)
  } catch (e) { return {} }
}

export default {
  command: ['claim', 'c', 'reclamar'],
  category: 'juegos',
  run: async (sock, m, args, from, isOwner, { prefix }) => {
    // 1. Verificación estricta de la base de datos
    if (!global.db?.data?.chats) {
        return await sock.sendMessage(from, { text: '❌ Error: La base de datos no está inicializada.' }, { quoted: m });
    }

    const chat = global.db.data.chats[from];
    if (!chat || !chat.rolls) {
        return await sock.sendMessage(from, { text: '❌ No hay registros de ruletas en este chat.' }, { quoted: m });
    }

    // 2. Obtener el ID del mensaje citado (la clave para encontrar el personaje)
    const quotedId = m.quoted ? m.quoted.key.id : null;

    if (!quotedId || !chat.rolls[quotedId]) {
      return await sock.sendMessage(from, { text: '⟡ No encontré registro de este personaje. Asegúrate de CITAR el mensaje original del bot.' }, { quoted: m });
    }

    if (chat.rolls[quotedId].claimed) {
      return await sock.sendMessage(from, { text: '⟡ Este personaje ya fue reclamado anteriormente.' }, { quoted: m });
    }

    // 3. Obtener datos
    const characterId = chat.rolls[quotedId].id;
    const structure = await loadCharacters();
    
    let characterName = "Desconocido";
    // Nota: Ajusta esto si tu characters.json tiene otra estructura
    for (const key in structure) {
        if (structure[key].id == characterId) {
            characterName = structure[key].name;
            break;
        }
    }

    // 4. Registrar reclamo
    chat.characters = chat.characters || {};
    chat.characters[characterId] = { user: m.sender, name: characterName };
    chat.rolls[quotedId].claimed = true;

    await sock.sendMessage(from, { 
        text: `⟡ ¡Felicidades! Has reclamado a *${characterName}* correctamente.`, 
        mentions: [m.sender] 
    }, { quoted: m });
  }
}
