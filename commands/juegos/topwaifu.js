const fs = require('fs');
const path = require('path');

module.exports = {
  command: ['topwaifu', 'top'],
  category: 'juegos',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const dir = path.join(process.cwd(), 'waifus_guardados');
      if (!fs.existsSync(dir)) return await client.sendMessage(m.chat, { text: '⟡ Aún no hay waifus reclamadas.' });

      const files = fs.readdirSync(dir);
      const ranking = files.map(file => {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        const data = JSON.parse(content);
        return { number: file.replace('.json', ''), count: data.waifus?.length || 0 };
      }).sort((a, b) => b.count - a.count).slice(0, 10);

      let txt = '🏆 *Top 10 Waifus Reclamadas* 🏆\n\n';
      ranking.forEach((u, i) => {
        txt += `${i + 1}. wa.me/${u.number} ❯ *${u.count} personajes*\n`;
      });

      // Envío sin citar y sin menciones para que la librería no colapse
      await client.sendMessage(m.chat, { text: txt });
    } catch (e) {
      console.error("Error en topwaifu.js:", e);
    }
  }
};
