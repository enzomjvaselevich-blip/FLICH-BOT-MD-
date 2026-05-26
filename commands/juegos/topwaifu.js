export default {
    command: ['topwaifu', 'top'],
    category: 'juegos',
    run: async (sock, m, args, from, isOwner, { prefix }) => {
        // 1. Verificar base de datos
        if (!global.db?.data?.chats || !global.db.data.chats[from]?.characters) {
            return await sock.sendMessage(from, { text: '❌ No hay datos de personajes en este grupo.' }, { quoted: m });
        }

        const chat = global.db.data.chats[from];
        const userStats = {};

        // 2. Procesar los personajes para contar cuántos tiene cada usuario
        // Asumimos que chat.characters guarda los objetos: { user: ID_USUARIO, name: NOMBRE }
        for (const charId in chat.characters) {
            const userId = chat.characters[charId].user;
            if (userId) {
                userStats[userId] = (userStats[userId] || 0) + 1;
            }
        }

        // 3. Convertir a array y ordenar
        const top = Object.entries(userStats)
            .sort((a, b) => b[1] - a[1]) // Ordenar por cantidad (mayor a menor)
            .slice(0, 10); // Tomar solo los primeros 10

        if (top.length === 0) {
            return await sock.sendMessage(from, { text: '⟡ No hay personajes reclamados todavía.' }, { quoted: m });
        }

        // 4. Formatear mensaje
        let txt = '🏆 *TOP 10 PERSONAJES RECLAMADOS* 🏆\n\n';
        for (let i = 0; i < top.length; i++) {
            const [userId, count] = top[i];
            const userName = `@${userId.split('@')[0]}`;
            txt += `${i + 1}. ${userName} ❯ *${count} personajes*\n`;
        }
        
        txt += '\n⟡ ¡Sigue reclamando para subir de puesto!';

        // 5. Enviar mensaje con menciones
        await sock.sendMessage(from, { 
            text: txt, 
            mentions: top.map(u => u[0]) 
        }, { quoted: m });
    }
}
