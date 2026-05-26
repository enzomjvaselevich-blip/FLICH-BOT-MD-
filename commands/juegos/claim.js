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
    // 1. Verificación de existencia de DB
    if (!global.db?.data?.chats || !global.db.data.chats[from]) {
        return await sock.sendMessage(from, { text: '❌ No hay registros de ruletas en este chat.' }, { quoted: m });
    }

    const chat = global.db.data.chats[from];
    
    // 2. Obtención del ID citado
    // Es crítico acceder a m.quoted.key.id para que coincida con el registro del rw.js
    const quotedId = m.quoted ? m.quoted.key.id : null;

    if (!quotedId || !chat.rolls || !chat.rolls[quotedId]) {
      return await sock.sendMessage(from, { text: '⟡ Cita el mensaje del personaje que quieres reclamar.' }, { quoted: m });
    }

    // 3. Verificación de reclamo previo
    if (chat.rolls[quotedId].claimed) {
      return await sock.sendMessage(from, { text: '⟡ Este personaje ya fue reclamado anteriormente.' }, { quoted: m });
    }

    // 4. Obtención de nombre del personaje
    const characterId = chat.rolls[quotedId].id;
    const structure = await loadCharacters();
    
    let characterName = "Desconocido";
    // Buscamos el nombre en el JSON
    for (const key in structure) {
        if (structure[key].id == characterId) {
            characterName = structure[key].name;
            break;
        }
    }

    // 5. Guardado del reclamo en la DB
    chat.characters = chat.characters || {};
    chat.characters[characterId] = { 
        user: m.sender, 
        name: characterName,
        timestamp: Date.now()
    };
    
    // Marcar como reclamado para que nadie más pueda hacerlo
    chat.rolls[quotedId].claimed = true;

    // 6. Respuesta al usuario
    await sock.sendMessage(from, { 
        text: `⟡ ¡Felicidades! Has reclamado a *${characterName}* correctamente.`, 
        mentions: [m.sender] 
    }, { quoted: m });
  }
}
