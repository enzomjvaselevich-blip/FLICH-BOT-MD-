import { resolveLidToRealJid } from "../../core/utils.js"
import { promises as fs } from 'fs'

const charactersFilePath = './core/characters.json'

export default {
  command: ['robwaifu', 'robarwaifu'],
  category: 'gacha',
  run: async (client, m, args, from, isOwner, { prefix }) => {
    try {
      // 1. Verificación de DB
      if (!global.db?.data?.chats) {
        return await client.sendMessage(from, { text: '❌ Base de datos no inicializada.' }, { quoted: m });
      }

      const chat = global.db.data.chats[from] || { users: {}, characters: {} };
      if (!chat.users) chat.users = {};
      if (!chat.users[m.sender]) chat.users[m.sender] = { characters: [], lastrobwaifu: 0 };
      
      const userData = chat.users[m.sender];
      const now = Date.now();
      const cooldown = 3 * 60 * 60 * 1000; // 3 horas

      // 2. Cooldown
      if (userData.lastrobwaifu && now < userData.lastrobwaifu) {
        const timeLeft = Math.ceil((userData.lastrobwaifu - now) / 1000);
        const h = Math.floor(timeLeft / 3600);
        const m_ = Math.floor((timeLeft % 3600) / 60);
        return await client.sendMessage(from, { text: `⟡ Debes esperar ${h}h ${m_}m para robar de nuevo.` }, { quoted: m });
      }

      // 3. Obtener víctima
      const mentioned = m.mentionedJid || [];
      const who2 = mentioned.length > 0 ? mentioned[0] : (m.quoted ? m.quoted.sender : null);
      
      if (!who2) return await client.sendMessage(from, { text: '⟡ Debes mencionar o citar a alguien para robar.' }, { quoted: m });
      
      const target = await resolveLidToRealJid(who2, client, from);
      if (!chat.users[target] || !chat.users[target].characters || chat.users[target].characters.length === 0) {
        return await client.sendMessage(from, { text: '⟡ El usuario no tiene personajes para robar.' }, { quoted: m });
      }

      // 4. Lógica de robo
      const victim = chat.users[target];
      const success = Math.random() < 0.4; // 40% probabilidad
      
      userData.lastrobwaifu = now + cooldown;

      if (!success) {
        return await client.sendMessage(from, { text: `⟡ Fallaste el robo. ¡La víctima se defendió!` }, { quoted: m });
      }

      // 5. Robar personaje
      const victimChars = victim.characters;
      const stolenId = victimChars[Math.floor(Math.random() * victimChars.length)];
      
      // Mover personaje
      victim.characters = victim.characters.filter(id => id !== stolenId);
      userData.characters.push(stolenId);

      // Obtener nombre para el mensaje
      const charName = chat.characters[stolenId]?.name || `ID:${stolenId}`;

      await client.sendMessage(from, { 
        text: `⟡ ¡Éxito! Has robado a *${charName}* del harem de @${target.split('@')[0]}.`,
        mentions: [target]
      }, { quoted: m });

    } catch (e) {
      console.error(e);
      await client.sendMessage(from, { text: '❌ Ocurrió un error al intentar robar.' }, { quoted: m });
    }
  }
}
