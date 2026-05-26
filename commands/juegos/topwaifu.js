const fs = require('fs');
const path = require('path');

module.exports = {
  command: ['topwaifu', 'top'],
  category: 'juegos',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const dir = path.join(process.cwd(), 'waifus_guardados');
      
      // 1. Leer los archivos de la carpeta
      if (!fs.existsSync(dir)) return await client.sendMessage(m.chat, { text: '⟡ Vacío.' });

      const files = fs.readdirSync(dir);
      const ranking = files.map(file => {
        try {
          const content = fs.readFileSync(path.join(dir, file), 'utf8');
          const data = JSON.parse(content);
          return { number: file.replace('.json', ''), count: data.waifus?.length || 0 };
        } catch { return null; }
      }).filter(Boolean).sort((a, b) => b.count - a.count).slice(0, 10);

      // 2. Formatear texto plano (evita problemas de procesado)
      let txt = '🏆 *Top 10 Waifus (Registro Físico)* 🏆\n\n';
      ranking.forEach((u, i) => {
        txt += `${i + 1}. wa.me/${u.number} ❯ *${u.count} personajes*\n`;
      });

      // 3. ENVIAR USANDO 'relayMessage' (BYPASS TOTAL)
      // client.sendMessage usa muchas validaciones que causan el crash.
      // relayMessage es más directo y evita el error de 'jidDecode'.
      await client.relayMessage(m.chat, { extendedTextMessage: { text: txt } }, {});

    } catch (e) {
      console.error("Error capturado en topwaifu:", e);
      // Fallback final: si relayMessage falla, intentamos una última vez
      await client.sendMessage(m.chat, { text: 'Error al generar ranking.' });
    }
  }
};
