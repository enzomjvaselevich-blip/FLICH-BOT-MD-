export default {
    command: ['topwaifu', 'top'],
    category: 'juegos',
    run: async (client, m, args, usedPrefix, command) => {
        // 1. Obtener datos del chat desde la base de datos global
        const chat = global.db.data.chats[m.chat];
        
        // 2. Verificación de datos
        if (!chat || !chat.users || Object.keys(chat.users).length === 0) {
            return await client.sendMessage(m.chat, { text: '❌ No hay personajes reclamados todavía.' }, { quoted: m });
        }

        const top = [];

        // 3. Procesar usuarios para el ranking
        for (const jid in chat.users) {
            const userChars = chat.users[jid].characters || [];
            if (userChars.length > 0) {
                top.push({ jid, count: userChars.length });
            }
        }

        // 4. Ordenar por cantidad (mayor a menor)
        top.sort((a, b) => b.count - a.count);
        const finalTop = top.slice(0, 10);
        
        if (finalTop.length === 0) {
            return await client.sendMessage(m.chat, { text: '⟡ No hay personajes reclamados para mostrar.' }, { quoted: m });
        }

        // 5. Construcción del mensaje
        let txt = '🏆 *Top más reclamados de waifus* 🏆\n\n';
        const mentions = [];

        finalTop.forEach((u, i) => {
            mentions.push(u.jid); 
            // Usamos el JID directamente para la mención
            const phoneNumber = u.jid.split('@')[0];
            txt += `${i + 1}. @${phoneNumber} ❯ *${u.count} personajes*\n`;
        });

        // 6. Envío usando client.sendMessage (Soluciona el error m.reply)
        await client.sendMessage(m.chat, { 
            text: txt, 
            mentions: mentions 
        }, { quoted: m });
    }
}
