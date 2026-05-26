export default {
    command: ['topwaifu', 'top'],
    category: 'juegos',
    run: async (client, m, args, usedPrefix, command) => {
        const chat = global.db.data.chats[m.chat];
        
        // Verificación de existencia
        if (!chat || !chat.users || Object.keys(chat.users).length === 0) {
            return await client.sendMessage(m.chat, { text: '❌ No hay personajes reclamados.' }, { quoted: m });
        }

        const top = [];

        // Contar personajes por usuario
        for (const jid in chat.users) {
            const userChars = chat.users[jid].characters || [];
            if (userChars.length > 0) {
                top.push({ jid, count: userChars.length });
            }
        }

        // Ordenar de mayor a menor
        top.sort((a, b) => b.count - a.count);
        const finalTop = top.slice(0, 10);
        
        if (finalTop.length === 0) {
            return await client.sendMessage(m.chat, { text: '⟡ No hay personajes registrados.' }, { quoted: m });
        }

        // Construir mensaje con etiquetas (tags)
        let txt = '🏆 *Top más reclamados de waifus* 🏆\n\n';
        const mentions = [];

        finalTop.forEach((u, i) => {
            mentions.push(u.jid); 
            // Esto crea el tag @ y muestra el número
            txt += `${i + 1}. @${u.jid.split('@')[0]} ❯ *${u.count} personajes*\n`;
        });

        // Enviar menciones
        await client.sendMessage(m.chat, { 
            text: txt, 
            mentions: mentions 
        }, { quoted: m });
    }
}
