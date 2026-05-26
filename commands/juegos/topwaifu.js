import fs from 'fs';
import path from 'path';

export default {
  command: ['topwaifu', 'top'],
  category: 'juegos',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const WAIFUS_DIR = path.join(process.cwd(), 'waifus_guardados');
      
      // 1. Verificar si la carpeta existe
      if (!fs.existsSync(WAIFUS_DIR)) {
        return await client.sendMessage(m.chat, { text: '⟡ No hay registros de waifus guardados aún.' });
      }

      // 2. Leer todos los archivos de la carpeta
      const files = fs.readdirSync(WAIFUS_DIR);
      const ranking = [];

      files.forEach(file => {
        if (file.endsWith('.json')) {
          const filePath = path.join(WAIFUS_DIR, file);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          
          if (data.waifus && data.waifus.length > 0) {
            ranking.push({
              number: file.replace('.json', ''),
              count: data.waifus.length
            });
          }
        }
      });

      // 3. Ordenar por cantidad
      const sortedRanking = ranking.sort((a, b) => b.count - a.count).slice(0, 10);

      if (sortedRanking.length === 0) {
        return await client.sendMessage(m.chat, { text: '⟡ El ranking está vacío.' });
      }

      // 4. Formatear mensaje
      let txt = '🏆 *Top 10 Waifus (Registro Físico)* 🏆\n\n';
      sortedRanking.forEach((item, index) => {
        txt += `${index + 1}. wa.me/${item.number} ❯ *${item.count} personajes*\n`;
      });

      // 5. Envío (Sin quoted para evitar errores de la librería)
      await client.sendMessage(m.chat, { text: txt });

    } catch (e) {
      console.error("Error en topwaifu.js:", e);
    }
  }
}
