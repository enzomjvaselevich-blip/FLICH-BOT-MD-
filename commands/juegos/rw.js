import axios from 'axios';
import fs from 'node:fs/promises';

const FILE_PATH = './core/characters.json';

async function loadCharacters() {
    try {
        const raw = await fs.readFile(FILE_PATH, 'utf-8');
        const data = JSON.parse(raw);
        return Object.values(data).flatMap(cat => cat.characters || []);
    } catch (e) { return []; }
}

async function buscarImagen(tag) {
    try {
        const query = (Array.isArray(tag) ? tag[0] : tag).trim().toLowerCase().replace(/\s+/g, '_');
        const { data } = await axios.get(`https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&tags=${query}`, { timeout: 5000 });
        if (Array.isArray(data) && data.length > 0) {
            const p = data[Math.floor(Math.random() * data.length)];
            return `https://safebooru.org/images/${p.directory}/${p.image}`;
        }
    } catch (e) { return null; }
    return null;
}

export default {
    command: ['rw', 'rollwaifu', 'ruleta'],
    category: 'gacha',
    run: async (client, m, args, usedPrefix, command) => {
        try {
            // Protección: Verificar DB
            if (!global.db || !global.db.data) {
                return m.reply("⟡ Base de datos no inicializada.");
            }

            const all = await loadCharacters();
            if (all.length === 0) return m.reply("No hay personajes cargados.");

            const selected = all[Math.floor(Math.random() * all.length)];
            const media = await buscarImagen(selected.tags);

            let caption = `⋆˚࿔ *${selected.name}* 𐙚˚⋆\n\n` +
                          `• Valor: ¥${selected.value || 100}\n` +
                          `• Género: ${selected.gender || 'Desconocido'}`;

            const imgRes = await axios.get(media || 'https://i.imgur.com/8JqP4kE.png', { responseType: 'arraybuffer' });
            const sent = await client.sendMessage(m.chat, { 
                image: Buffer.from(imgRes.data), 
                caption: caption 
            }, { quoted: m });

            global.db.data.chats[m.chat].rolls = global.db.data.chats[m.chat].rolls || {};
            global.db.data.chats[m.chat].rolls[sent.key.id] = { id: selected.id, claimed: false };

        } catch (e) {
            console.error(e);
            m.reply("Error procesando la ruleta.");
        }
    }
};
