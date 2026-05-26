export default {
  command: ['topwaifu', 'top'],
  category: 'juegos',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const dir = path.join(process.cwd(), 'waifus_guardados');
      
      if (!fs.existsSync(dir)) return await client.sendMessage(m.chat, { text: 'Vacío.' });

      const files = fs.readdirSync(dir);
      const ranking = files.map(file => {
        const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
        return { number: file.replace('.json', ''), count: data.waifus?.length || 0 };
      }).sort((a, b) => b.count - a.count).slice(0, 10);

      let txt = '🏆 *Top Waifus* 🏆\n\n';
      ranking.forEach((u, i) => {
        txt += `${i + 1}. wa.me/${u.number} ❯ *${u.count}*\n`;
      });

      await client.sendMessage(m.chat, { text: txt });
    } catch (e) {
      console.error(e);
    }
  }
}
