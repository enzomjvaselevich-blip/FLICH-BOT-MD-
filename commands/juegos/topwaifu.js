export default {
    command: ['topwaifu', 'top'],
    category: 'juegos',
    run: async (client, m, args, usedPrefix, command) => {
        const chat = global.db.data.chats[m.chat];
        
        // 1. Verificación de datos basada en la estructura de robwaifu.js
        if (!chat || !chat.users || Object.keys(chat.users).length === 0) {
            return m.reply('❌ No hay personajes reclamados todavía.');
        }

        const top = [];

        // 2. Procesar usuarios para el ranking
        for (const jid in chat.users) {
            const userChars = chat.users[jid].characters || [];
            if (userChars.length > 0) {
                top.push({ jid, count: userChars.length });
            }
        }

        // 3. Ordenar por cantidad (mayor a menor)
        top.sort((a, b) => b.count - a.count);
        const finalTop = top.slice(0, 10);
        
        if (finalTop.length === 0) {
            return m.reply('⟡ No hay personajes reclamados para mostrar.');
        }

        // 4. Construcción del mensaje con etiquetas seguras
        let txt = '🏆 *Top más reclamados de waifus* 🏆\n\n';
        const mentions = [];

        finalTop.forEach((u, i) => {
            mentions.push(u.jid); // Agregar JID a menciones para que WhatsApp los reconozca
            
            // Usamos el JID directo y separamos el número de teléfono para el tag visible
            const phoneNumber = u.jid.split('@')[0];
            txt += `${i + 1}. @${phoneNumber} ❯ *${u.count} personajes*\n`;
        });

        // 5. Envío usando el método de tu bot (basado en robwaifu.js)
        await client.sendMessage(m.chat, { 
            text: txt, 
            mentions: mentions 
        }, { quoted: m });
    }
}
