import { promises as fs } from 'fs';
const charactersFilePath = './core/characters.json';

async function loadCharacters() {
    const data = JSON.parse(await fs.readFile(charactersFilePath, 'utf-8'));
    // Aplanamos la estructura para buscar por ID fácilmente
    return Object.values(data).flatMap(cat => cat.characters);
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
            const db = global.db.data;
            const chat = db.chats[from];
            chat.characters ||= {};
            chat.rolls ||= {};

            const quotedId = m.quoted?.id || m.message?.extendedTextMessage?.contextInfo?.stanzaId;
            if (!quotedId || !chat.rolls[quotedId]) {
                return await sock.sendMessage(from, { text: `⟡ 𝗗𝗲𝗯𝗲𝘀 𝗰𝗶𝘁𝗮𝗿 𝘂𝗻 𝗽𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲 𝘃𝗮́𝗹𝗶𝗱𝗼 𝗽𝗮𝗿𝗮 𝗿𝗲𝗰𝗹𝗮𝗺𝗮𝗿.` }, { quoted: m });
            }

            const rollData = chat.rolls[quotedId];
            const allChars = await loadCharacters();
            const charData = allChars.find(c => String(c.id) === String(rollData.id));

            if (!charData) return await sock.sendMessage(from, { text: '⟡ 𝗣𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲 𝗻𝗼 𝗲𝗻𝗰𝗼𝗻𝘁𝗿𝗮𝗱𝗼.' }, { quoted: m });
            if (chat.characters[charData.id]?.user) return await sock.sendMessage(from, { text: `⟡ 𝗬𝗮 𝗽𝗲𝗿𝘁𝗲𝗻𝗲𝗰𝗲 𝗮 𝗼𝘁𝗿𝗼 𝘂𝘀𝘂𝗮𝗿𝗶𝗼.` }, { quoted: m });

            chat.characters[charData.id] = { user: m.sender, name: charData.name };
            chat.rolls[quotedId].claimed = true;

            await sock.sendMessage(from, { text: `⟡ *${charData.name}* 𝗵𝗮 𝘀𝗶𝗱𝗼 𝗿𝗲𝗰𝗹𝗮𝗺𝗮𝗱𝗼 𝗽𝗼𝗿 *${m.pushName || 'Usuario'}*` }, { quoted: m });
        } catch (e) {
            await sock.sendMessage(from, { text: `> Error: ${e.message}` }, { quoted: m });
        }
    }
};
