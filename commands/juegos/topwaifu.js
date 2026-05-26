export default {
    command: ['topwaifu', 'top'],
    category: 'juegos',
    run: async (sock, m, args, from, isOwner, { prefix }) => {
        const chat = global.db?.data?.chats[from];
        
        // Verificamos si existen personajes
        if (!chat || !chat.characters || Object.keys(chat.characters).length === 0) {
            return await sock.sendMessage(from, { text: '❌ No hay personajes reclamados todavía.' }, { quoted: m });
        }

        const userStats = {};
        // Recorremos los personajes reclamados
        for (const charId in chat.characters) {
            const userId = chat.characters[charId].user;
            if (userId) {
                userStats[userId] = (userStats[userId] || 0) + 1;
            }
        }

        const top = Object.entries(userStats).sort((a, b) => b[1] - a[1]).slice(0, 10);
        
        if (top.length === 0) return await sock.sendMessage(from, { text: '⟡ No hay datos para mostrar.' }, { quoted: m });

        let txt = '🏆 *Top más reclamados de waifus* 🏆\n\n';
        const mentions = [];

        top.forEach((u, i) => {
            const jid = u[0];
            const count = u[1];
            mentions.push(jid);
            txt += `${i + 1}. @${jid.split('@')[0]} ❯ *${count}*\n`;
        });

        await sock.sendMessage(from, { 
            text: txt, 
            mentions: mentions 
        }, { quoted: m });
    }
}
