export default {
    command: ['topwaifu', 'top'],
    category: 'juegos',
    run: async (sock, m, args, from, isOwner, { prefix }) => {
        const chat = global.db?.data?.chats[from];
        
        // Verificación de datos
        if (!chat || !chat.characters || Object.keys(chat.characters).length === 0) {
            return await sock.sendMessage(from, { text: '❌ No hay personajes reclamados todavía.' }, { quoted: m });
        }

        const userStats = {};
        // Contar personajes por usuario
        for (const key in chat.characters) {
            const userId = chat.characters[key].user;
            if (userId) {
                userStats[userId] = (userStats[userId] || 0) + 1;
            }
        }

        // Ordenar de mayor a menor
        const top = Object.entries(userStats).sort((a, b) => b[1] - a[1]).slice(0, 10);
        
        if (top.length === 0) return await sock.sendMessage(from, { text: '⟡ No hay datos para mostrar.' }, { quoted: m });

        // Texto solicitado
        let txt = '🏆 *Top más reclamados de waifus* 🏆\n\n';
        
        // Lista de menciones para que los tags funcionen
        const mentions = [];

        top.forEach((u, i) => {
            const jid = u[0];
            const count = u[1];
            mentions.push(jid); // Agregamos al array de menciones
            
            // Usamos @nombre para la mención
            txt += `${i + 1}. @${jid.split('@')[0]} ❯ *${count}*\n`;
        });

        await sock.sendMessage(from, { 
            text: txt, 
            mentions: mentions 
        }, { quoted: m });
    }
}
