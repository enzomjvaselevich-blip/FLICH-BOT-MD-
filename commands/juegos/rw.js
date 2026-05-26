import axios from 'axios';
import fs from 'node:fs/promises';

const FILE_PATH = './core/characters.json';

async function loadCharacters() {
    try {
        const raw = await fs.readFile(FILE_PATH, 'utf-8');
        const data = JSON.parse(raw);
        let all = [];
        for (const key in data) {
            if (data[key].characters && Array.isArray(data[key].characters)) {
                all = all.concat(data[key].characters);
            }
        }
        return all;
    } catch (e) { return []; }
}

export default {
    command: ['rw', 'rollwaifu', 'ruleta'],
    category: 'gacha',
    run: async (ctx) => {
        const { sock, from } = ctx;
        const m = ctx.m || ctx.msg;

        try {
            const allCharacters = await loadCharacters();
            if (allCharacters.length === 0) return await sock.sendMessage(from, { text: "No hay personajes cargados." }, { quoted: m });

            const selected = allCharacters[Math.floor(Math.random() * allCharacters.length)];
            const query = (Array.isArray(selected.tags) ? selected.tags[0] : selected.tags).trim().toLowerCase().replace(/\s+/g, '_');
            const { data } = await axios.get(`https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&tags=${query}`, { timeout: 5000 });
            
            const p = data[Math.floor(Math.random() * data.length)];
            const media = `https://safebooru.org/images/${p.directory}/${p.image}`;

            const imgRes = await axios.get(media, { responseType: 'arraybuffer' });
            const sent = await sock.sendMessage(from, { 
                image: Buffer.from(imgRes.data), 
                caption: `⋆˚࿔ *${selected.name}* 𐙚˚⋆\n\n• Valor: ¥${selected.value || 100}\n• Género: ${selected.gender || 'Desconocido'}` 
            }, { quoted: m });

            // Protección de DB
            if (global.db && global.db.data) {
                global.db.data.chats = global.db.data.chats || {};
                global.db.data.chats[from] = global.db.data.chats[from] || { rolls: {} };
                global.db.data.chats[from].rolls[sent.key.id] = { id: selected.id, claimed: false };
            }
        } catch (e) {
            console.error(e);
            await sock.sendMessage(from, { text: "Error procesando la ruleta." }, { quoted: m });
        }
    }
};
