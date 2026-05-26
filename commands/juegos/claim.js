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
    // 1. Asegurar que la base de datos global exista
    if (!global.db) global.db = { data: { chats: {} } };
    if (!global.db.data) global.db.data = { chats: {} };
    
    const db = global.db.data;
    db.chats[from] = db.chats[from] || { users: {}, characters: {}, rolls: {} };
    const chat = db.chats[from];

    // 2. Obtener el ID del mensaje citado
    const quoted = m.quoted ? m.quoted : m;
    const quotedId = quoted.id || (m.message?.extendedTextMessage?.contextInfo?.stanzaId);

    if (!quotedId || !chat.rolls[quotedId]) {
      return await sock.sendMessage(from, { text: '⟡ Cita el mensaje del personaje que quieres reclamar.' }, { quoted: m });
    }

    // 3. Verificar si ya fue reclamado
    if (chat.rolls[quotedId].claimed) {
      return await sock.sendMessage(from, { text: '⟡ Este personaje ya fue reclamado anteriormente.' }, { quoted: m });
    }

    // 4. Obtener datos del personaje
    const characterId = chat.rolls[quotedId].id;
    const structure = await loadCharacters();
    
    // Buscamos el nombre en el archivo JSON de personajes
    let characterName = "Desconocido";
    for (const category in structure) {
        const found = structure[category].characters.find(c => String(c.id) === String(characterId));
        if (found) {
            characterName = found.name;
            break;
        }
    }

    // 5. Realizar el reclamo
    chat.characters = chat.characters || {};
    chat.characters[characterId] = { 
        user: m.sender, 
        name: characterName,
        timestamp: Date.now()
    };
    
    chat.rolls[quotedId].claimed = true;

    await sock.sendMessage(from, { 
        text: `⟡ ¡Felicidades! Has reclamado a *${characterName}* correctamente.`, 
        mentions: [m.sender] 
    }, { quoted: m });
  }
}
