export default {
    command: ['topwaifu', 'top'],
    category: 'juegos',
    run: async (client, m, args, usedPrefix, command) => {
        // 1. Acceder al chat actual en la DB
        const chat = global.db.data.chats[m.chat];
        
        // 2. Validación de seguridad para evitar errores de "undefined"
        if (!chat || !chat.users || Object.keys(chat.users).length === 0) {
            return await client.sendMessage(m.chat, { text: '❌ No hay usuarios con personajes reclamados en este chat.' }, { quoted: m });
        }

        const ranking = [];

        // 3. Procesar datos de usuarios (basado en la estructura de tu claim.js)
        for (const jid in chat.users) {
            const userData = chat.users[jid];
            // Contamos los personajes en el array 'characters'
            const count = (userData.characters && Array.isArray(userData.characters)) ? userData.characters.length : 0;
            
            if (count > 0) {
                ranking.push({ jid, count });
            }
        }

        // 4. Ordenar de mayor a menor
        ranking.sort((a, b) => b.count - a.count);
        const top10 = ranking.slice(0, 10);
        
        if (top10.length === 0) {
            return await client.sendMessage(m.chat, { text: '⟡ No hay personajes reclamados para mostrar.' }, { quoted: m });
        }

        // 5. Crear mensaje y lista de menciones
        let txt = '🏆 *Top más reclamados de waifus* 🏆\n\n';
        const mentions = [];

        top10.forEach((u, i) => {
            mentions.push(u.jid); // Añadir JID para mención oficial
            // Usamos el JID para el tag, así evitamos buscar nombres que no existen
            const tag = u.jid.split('@')[0];
            txt += `${i + 1}. @${tag} ❯ *${u.count} personajes*\n`;
        });

        // 6. Enviar
        await client.sendMessage(m.chat, { 
            text: txt, 
            mentions: mentions 
        }, { quoted: m });
    }
}
