module.exports = {
  command: ['menu', 'help', 'comandos'],
  description: 'Muestra el menu de comandos',
  categoria: 'general',
  run: async (client, m, args, from, isCreator, ctx = {}) => {
    const prefix = ctx?.prefix || '.';
    
    // Cálculo del tiempo activo
    const runtime = (seconds) => {
      const d = Math.floor(seconds / (3600 * 24));
      const h = Math.floor((seconds % (3600 * 24)) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      return `${d}d ${h}h ${m}m ${s}s`;
    };
    const uptime = runtime(process.uptime());

    const lines = [
      '━━━━━━━━━━━━',
      '  🤖 FLICH-BOT-MD 🤖',
      '━━━━━━━━━━━━',
      '',
      '*Powered by FLEXT-OFC* ⚡',
      '',
      '📍 *Estado*',
      `├─ Prefix: \`${prefix}\``,
      `└─ Activo: ${uptime}`,
      '',
      '━━━━━━━━━━━━',
      '📜 *MENU DE COMANDOS*',
      '━━━━━━━━━━━━',
      '',
      '🎵 *Descargas*',
      `├─ ${prefix}play <nombre> `,
      `├─ ${prefix}ytmp3 <link/nombre>`,
      `├─ ${prefix}ytmp4 <link/nombre>`,
      `├─ ${prefix}tiktok <link>`,
      `├─ ${prefix}instagram <link>`,
      `├─ ${prefix}facebook <link>`,
      `└─ ${prefix}mediafire <link>`,
      '',
      '⚙️ *Sistema*',
      `├─ ${prefix}infobot`,
      `├─ ${prefix}hora`,
      `├─ ${prefix}sistema`,
      `└─ ${prefix}speed`,
      '',
      '👥 *Grupos*',
      `├─ ${prefix}antilink on/off`,
      `├─ ${prefix}modoadmin on/off`,
      `├─ ${prefix}grupo abrir/cerrar`,
      `└─ ${prefix}antiprivado on/off`,
      '',
      '👑 *Owner*',
      `├─ ${prefix}update`,
      `└─ ${prefix}setapi auto`,
      '',
      '━━━━━━━━━━━━',
      '💡 Tip: Usa .play para elegir entre MP3/MP4',
      '⚡ Respuesta rápida y estable',
      '━━━━━━━━━━━━'
    ];

    const menuVideo = 'https://raw.githubusercontent.com/enzomjvaselevich-blip/FLICH-BOT-MD-/main/videos-imagenes/menu.mp4';
    await client.sendMessage(m.key.remoteJid, {
      video: { url: menuVideo },
      gifPlayback: true,
      caption: lines.join('\n'),
    }, { quoted: m });
  },
};