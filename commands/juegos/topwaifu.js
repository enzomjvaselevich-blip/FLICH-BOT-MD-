export default {
    command: ['topwaifu', 'top'],
    category: 'juegos',
    run: async (client, m, args, usedPrefix, command) => {
        const chat = global.db.data.chats[m.chat];
        
        // 1. Verificación básica de datos
        if (!chat || !chat.users || Object.keys(chat.users).length === 0) {
            return await client.sendMessage(m.chat, { text: '❌ No hay personajes reclamados todavía.' }, { quoted: m });
        }

        const ranking = [];

        // 2. Procesar los usuarios y contar sus personajes
        // Buscamos dentro de chat.users, igual que robwaifu.js
        for (const jid in chat.users) {
            const userData = chat.users[jid];
            const count = (userData.characters && Array.isArray(userData.characters)) ? userData.characters.length : 0;
            
            if (count > 0) {
                ranking.push({ jid, count });
            }
        }

        // 3. Ordenar por cantidad (mayor a menor)
        ranking.sort((a, b) => b.count - a.count);
        const top10 = ranking.slice(0, 10);
        
        if (top10.length === 0) {
            return await client.sendMessage(m.chat, { text: '⟡ No hay personajes reclamados para mostrar.' }, { quoted: m });
        }

        // 4. Crear el mensaje de ranking
        let txt = '🏆 *Top más reclamados de waifus* 🏆\n\n';
        const mentions = [];

        top10.forEach((u, i) => {
            mentions.push(u.jid); // Añadimos el JID para que WhatsApp lo reconozca y cree el tag
            const tag = u.jid.split('@')[0]; // Extraemos el número para el texto
            txt += `${i + 1}. @${tag} ❯ *${u.count} personajes*\n`;
        });

        // 5. Envío del mensaje usando el cliente para evitar el error m.reply
        await client.sendMessage(m.chat, { 
            text: txt, 
            mentions: mentions 
        }, { quoted: m });
    }
}
