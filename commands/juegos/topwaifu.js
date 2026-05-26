export default {
    command: ['topwaifu', 'top'],
    category: 'juegos',
    run: async (client, m, args, usedPrefix, command) => {
        try {
            // 1. Acceso a la base de datos
            const chat = global.db.data.chats[m.chat];
            if (!chat || !chat.users) {
                return await client.sendMessage(m.chat, { text: '❌ No hay datos de usuarios.' }, { quoted: m });
            }

            // 2. Construcción del ranking (Solo IDs y conteo)
            const ranking = [];
            for (const jid in chat.users) {
                const count = chat.users[jid]?.characters?.length || 0;
                if (count > 0) {
                    ranking.push({ jid, count });
                }
            }

            if (ranking.length === 0) {
                return await client.sendMessage(m.chat, { text: '⟡ No hay waifus reclamadas.' }, { quoted: m });
            }

            // 3. Ordenar
            ranking.sort((a, b) => b.count - a.count);
            const top10 = ranking.slice(0, 10);

            // 4. Formatear mensaje
            let txt = '🏆 *Top más reclamados de waifus* 🏆\n\n';
            const mentions = [];

            top10.forEach((item, index) => {
                mentions.push(item.jid); // Esto crea el tag clicable
                const number = item.jid.split('@')[0];
                txt += `${index + 1}. @${number} ❯ *${item.count}*\n`;
            });

            // 5. Envío directo con el cliente
            await client.sendMessage(m.chat, { 
                text: txt, 
                mentions: mentions 
            }, { quoted: m });

        } catch (error) {
            console.error("Error crítico en topwaifu:", error);
            // Si falla, intentamos enviar un mensaje simple para no romper el bot
            await client.sendMessage(m.chat, { text: '⚠️ Ocurrió un error al procesar el top.' });
        }
    }
}
