import fs from 'node:fs/promises';
import path from 'node:path';

const USERS_FILE_PATH = './core/users.json';

export default {
    command: ['topreclamos', 'toppersonajes', 'topwaifus'],
    category: 'gacha',
    run: async (ctx) => {
        const { sock, from } = ctx;
        const m = ctx.m || ctx.msg;

        try {
            // 1. Verificar si el archivo existe, si no, crearlo automáticamente
            let usersData = {};
            try {
                const raw = await fs.readFile(USERS_FILE_PATH, 'utf-8');
                usersData = JSON.parse(raw);
            } catch (e) {
                if (e.code === 'ENOENT') {
                    // Crear la carpeta core si no existe y luego el archivo vacío
                    await fs.mkdir(path.dirname(USERS_FILE_PATH), { recursive: true });
                    await fs.writeFile(USERS_FILE_PATH, JSON.stringify({}, null, 2), 'utf-8');
                    usersData = {};
                } else {
                    console.error("Error cargando base de datos de usuarios:", e);
                    return await sock.sendMessage(from, { text: "No pude acceder a los registros de reclamos." }, { quoted: m });
                }
            }

            // 2. Obtener los metadatos del grupo para saber quiénes están presentes
            const groupMetadata = await sock.groupMetadata(from).catch(() => null);
            if (!groupMetadata) {
                return await sock.sendMessage(from, { text: "Este comando solo funciona en grupos." }, { quoted: m });
            }

            const participants = groupMetadata.participants.map(p => p.id);

            // 3. Filtrar y contar los personajes de la gente del grupo actual
            let leaderboard = [];
            
            for (const jid of participants) {
                if (usersData[jid]) {
                    // Se verifica el array de personajes de cada usuario
                    const cantidad = usersData[jid].personajes ? usersData[jid].personajes.length : 0; 
                    if (cantidad > 0) {
                        leaderboard.push({ jid, cantidad });
                    }
                }
            }

            if (leaderboard.length === 0) {
                return await sock.sendMessage(from, { text: "Nadie en este grupo ha reclamado personajes aún." }, { quoted: m });
            }

            // 4. Ordenar el top de mayor a menor
            leaderboard.sort((a, b) => b.cantidad - a.cantidad);
            
            // Tomar el Top 10
            const top10 = leaderboard.slice(0, 10);

            // 5. Construir el mensaje con el diseño del sistema
            let textoTop = `⋆˚࿔ *TOP RECLAMOS* 𐙚˚⋆\n\n`;
            
            for (let i = 0; i < top10.length; i++) {
                const user = top10[i];
                const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `⟡`;
                
                textoTop += `${medalla} @${user.jid.split('@')[0]} \n`;
                textoTop += `  ↳ 𝙴𝚜𝚌𝚛𝚒𝚋𝚎: ${user.cantidad} personajes\n\n`; 
            }

            // 6. Enviar mensaje etiquetando a los usuarios correspondientes
            await sock.sendMessage(from, { 
                text: textoTop.trim(), 
                mentions: top10.map(u => u.jid) 
            }, { quoted: m });

        } catch (e) {
            console.error("Error crítico en el top de personajes:", e);
            await sock.sendMessage(from, { text: "Ocurrió un error al procesar el top." }, { quoted: m });
        }
    }
};
