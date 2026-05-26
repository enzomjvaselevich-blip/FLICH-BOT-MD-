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
    // Asegurar estructura
    global.db.data.chats[from] = global.db.data.chats[from] || { users: {}, characters: {}, rolls: {} };
    const chat = global.db.data.chats[from];

    // Obtener el ID del mensaje citado correctamente
    const quoted = m.quoted ? m.quoted : m;
    const quotedId = quoted.key ? quoted.key.id : null;

    console.log("ID citado intentando reclamar:", quotedId); // Para debug en consola

    if (!quotedId || !chat.rolls || !chat.rolls[quotedId]) {
      return await sock.sendMessage(from, { text: '⟡ No encontré registro de este personaje. Asegúrate de citar el mensaje original del bot.' }, { quoted: m });
    }

    if (chat.rolls[quotedId].claimed) {
      return await sock.sendMessage(from, { text: '⟡ Este personaje ya fue reclamado.' }, { quoted: m });
    }

    const characterId = chat.rolls[quotedId].id;
    const structure = await loadCharacters();
    
    let characterName = "Desconocido";
    // ... (tu lógica de búsqueda de nombre se mantiene igual) ...

    chat.rolls[quotedId].claimed = true; // Marcar como reclamado

    await sock.sendMessage(from, { 
        text: `⟡ ¡Felicidades! Has reclamado a *${characterName}* correctamente.`, 
        mentions: [m.sender] 
    }, { quoted: m });
  }
}
