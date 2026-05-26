export default {
    command: ['topwaifu', 'top'],
    category: 'juegos',
    run: async (client, m, args, usedPrefix, command) => {
        // 1. Acceso seguro a la base de datos
        const chat = global.db?.data?.chats?.[m.chat];
        
        if (!chat || !chat.users || Object.keys(chat.users).length === 0) {
            return await client.sendMessage(m.chat, { text: '❌ No hay personajes reclamados.' }, { quoted: m });
        }

        // 2. Construcción del ranking (leyendo directamente de chat.users)
        const ranking = [];
        for (const jid in chat.users) {
            const userCharacters = chat.users[jid]?.characters || [];
            if (userCharacters.length > 0) {
                ranking.push({ jid: jid, count: userCharacters.length });
            }
        }

        if (ranking.length === 0) {
            return await client.sendMessage(m.chat, { text: '⟡ No hay datos para mostrar.' }, { quoted: m });
        }

        // 3. Ordenar de mayor a menor
        ranking.sort((a, b) => b.count - a.count);
        const top10 = ranking.slice(0, 10);

        // 4. Formateo del mensaje y preparación de menciones
        let txt = '🏆 *Top más reclamados de waifus* 🏆\n\n';
        const mentions = [];

        top10.forEach((item, index) => {
            mentions.push(item.jid); // Necesario para que el tag funcione
            const phoneNumber = item.jid.split('@')[0];
            txt += `${index + 1}. @${phoneNumber} ❯ *${item.count} personajes*\n`;
        });

        // 5. Envío del mensaje
        try {
            await client.sendMessage(m.chat, { 
                text: txt, 
                mentions: mentions 
            }, { quoted: m });
        } catch (error) {
            console.error("Error al enviar mensaje de topwaifu:", error);
            await m.reply("❌ Ocurrió un error al intentar enviar el top.");
        }
    }
}
