export default {
    command: ['topwaifu', 'top'],
    category: 'juegos',
    run: async (sock, m, args, from, isOwner, { prefix }) => {
        const chat = global.db?.data?.chats[from];
        
        if (!chat || !chat.users || Object.keys(chat.users).length === 0) {
            return await sock.sendMessage(from, { text: '❌ No hay personajes reclamados todavía.' }, { quoted: m });
        }

        const top = [];
        // Contamos basándonos en la lista 'characters' de cada usuario
        for (const userId in chat.users) {
            const userChars = chat.users[userId].characters || [];
            top.push([userId, userChars.length]);
        }

        // Ordenamos por cantidad
        top.sort((a, b) => b[1] - a[1]);
        const finalTop = top.slice(0, 10);
        
        if (finalTop.length === 0 || finalTop[0][1] === 0) {
            return await sock.sendMessage(from, { text: '⟡ No hay personajes reclamados para mostrar.' }, { quoted: m });
        }

        let txt = '🏆 *Top más reclamados de waifus* 🏆\n\n';
        const mentions = [];

        finalTop.forEach((u, i) => {
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
