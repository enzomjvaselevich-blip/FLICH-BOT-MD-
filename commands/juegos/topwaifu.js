export default {
    command: ['topwaifu', 'top'],
    category: 'juegos',
    run: async (sock, m, args, from, isOwner, { prefix }) => {
        const chat = global.db?.data?.chats[from];
        
        // 1. Verificación robusta de datos
        if (!chat || !chat.users || Object.keys(chat.users).length === 0) {
            return await sock.sendMessage(from, { text: '❌ No hay personajes reclamados todavía.' }, { quoted: m });
        }

        const top = [];

        // 2. Procesar usuarios
        for (const jid in chat.users) {
            const userChars = chat.users[jid].characters || [];
            if (userChars.length > 0) {
                top.push({ jid, count: userChars.length });
            }
        }

        // 3. Ordenar por cantidad
        top.sort((a, b) => b.count - a.count);
        const finalTop = top.slice(0, 10);
        
        if (finalTop.length === 0) {
            return await sock.sendMessage(from, { text: '⟡ No hay personajes reclamados para mostrar.' }, { quoted: m });
        }

        // 4. Construcción del mensaje con etiquetas seguras
        let txt = '🏆 *Top más reclamados de waifus* 🏆\n\n';
        const mentions = [];

        finalTop.forEach((u, i) => {
            mentions.push(u.jid); // Agregar JID a menciones para que WhatsApp los reconozca
            // Usamos @ seguido del número del JID para que funcione el tag
            const phoneNumber = u.jid.split('@')[0];
            txt += `${i + 1}. @${phoneNumber} ❯ *${u.count} personajes*\n`;
        });

        await sock.sendMessage(from, { 
            text: txt, 
            mentions: mentions 
        }, { quoted: m });
    }
}
