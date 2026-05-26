import axios from 'axios';
import fs from 'node:fs/promises';

const FILE_PATH = './core/characters.json';

async function loadCharacters() {
    try {
        const raw = await fs.readFile(FILE_PATH, 'utf-8');
        const data = JSON.parse(raw);
        let all = [];
        for (const key in data) {
            if (data[key].characters) all = all.concat(data[key].characters);
        }
        return all;
    } catch (e) { return []; }
}

export default {
    command: ['rw', 'rollwaifu', 'ruleta'],
    category: 'gacha',
    run: async (sock, m, args, from, isOwner, context) => { // Ajustado a tus parámetros
        try {
            const all = await loadCharacters();
            const selected = all[Math.floor(Math.random() * all.length)];
            const query = selected.tags[0].replace(/\s+/g, '_');
            const { data } = await axios.get(`https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&tags=${query}`);
            const p = data[Math.floor(Math.random() * data.length)];
            const media = `https://safebooru.org/images/${p.directory}/${p.image}`;

            const imgRes = await axios.get(media, { responseType: 'arraybuffer' });
            const sent = await sock.sendMessage(from, { 
                image: Buffer.from(imgRes.data), 
                caption: `⋆˚࿔ *${selected.name}* 𐙚˚⋆\n\n• Valor: ¥${selected.value}` 
            }, { quoted: m });

            global.db.data.chats[from].rolls ||= {};
            global.db.data.chats[from].rolls[sent.key.id] = { id: selected.id, claimed: false };
        } catch (e) {
            await sock.sendMessage(from, { text: "Error en la ruleta: " + e.message }, { quoted: m });
        }
    }
};
