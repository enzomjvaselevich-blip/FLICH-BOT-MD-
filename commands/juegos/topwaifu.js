Export default {
    command: ['topwaifu', 'top'],
    category: 'juegos',
    run: async (sock, m, args, from, isOwner, { prefix }) => {
        const chat = global.db?.data?.chats[from];
        if (!chat || !chat.characters) {
            return await sock.sendMessage(from, { text: '❌ No hay personajes reclamados.' }, { quoted: m });
        }

        const userStats = {};
        // Recorremos los personajes reclamados
        for (const key in chat.characters) {
            const userId = chat.characters[key].user;
            userStats[userId] = (userStats[userId] || 0) + 1;
        }

        const top = Object.entries(userStats).sort((a, b) => b[1] - a[1]).slice(0, 10);
        
        if (top.length === 0) return await sock.sendMessage(from, { text: '⟡ No hay personajes.' }, { quoted: m });

        let txt = '🏆 *TOP 10 WAIFUS* 🏆\n\n';
        top.forEach((u, i) => {
            txt += `${i + 1}. @${u[0].split('@')[0]} ❯ *${u[1]}*\n`;
        });

        await sock.sendMessage(from, { text: txt, mentions: top.map(u => u[0]) }, { quoted: m });
    }
}