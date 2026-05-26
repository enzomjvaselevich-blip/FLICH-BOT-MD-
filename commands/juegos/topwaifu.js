export default {
    command: ['topwaifu', 'top'],
    category: 'juegos',
    run: async (sock, m, args, from, isOwner, { prefix }) => {
        const chat = global.db?.data?.chats[from];
        
        // Verificación de datos basada en la estructura de robwaifu.js
        if (!chat || !chat.users || Object.keys(chat.users).length === 0) {
            return await sock.sendMessage(from, { text: '❌ No hay personajes reclamados todavía.' }, { quoted: m });
        }

        const top = [];

        // Procesar usuarios para el ranking
        for (const jid in chat.users) {
            const userChars = chat.users[jid].characters || [];
            if (userChars.length > 0) {
                top.push({ jid, count: userChars.length });
            }
        }

        // Ordenar por cantidad (mayor a menor)
        top.sort((a, b) => b.count - a.count);
        const finalTop = top.slice(0, 10);
        
        if (finalTop.length === 0) {
            return await sock.sendMessage(from, { text: '⟡ No hay personajes reclamados para mostrar.' }, { quoted: m });
        }

        // Construcción del mensaje
        let txt = '🏆 *Top más reclamados de waifus* 🏆\n\n';
        const mentions = [];

        finalTop.forEach((u, i) => {
            mentions.push(u.jid); 
            // Usamos el JID directo y eliminamos la dependencia de 'name' para evitar el 'undefined'
            const phoneNumber = u.jid.split('@')[0];
            txt += `${i + 1}. @${phoneNumber} ❯ *${u.count} personajes*\n`;
        });

        await sock.sendMessage(from, { 
            text: txt, 
            mentions: mentions 
        }, { quoted: m });
    }
}
