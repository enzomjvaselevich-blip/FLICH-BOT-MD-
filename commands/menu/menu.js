module.exports = {
  command: ['menu', 'help', 'comandos'],
  description: 'Muestra el menu de comandos',
  categoria: 'general',
  run: async (client, m, args, from, isCreator, ctx = {}) => {
    const prefix = ctx?.prefix || '.';
    const settings = ctx?.settings || {};
    const owner = String(settings.ownerNumber || '51907376960');
    const apiReady = Boolean(String(settings.apiBaseUrl || '').trim() && String(settings.apiKey || '').trim());
    const lines = [
      '╔═━────━━─━═━────━━─━═╗',
      '║      *HIYUKI-BOT* 華       ║',
      '╚═━────━━─━═━────━━─━═╝',
      '⟡ _Power • Elegance • Speed_ ⟡',
      '',
      '┌─ 〘 *ESTADO* 〙',
      `│ ✦ Prefix: \`${prefix}\``,
      `│ ✦ API: *${apiReady ? 'Activa' : 'Pendiente'}*`,
      `│ ✦ Owner: _${owner}_`,
      '└──────────────',
      '',
      '┌─ 〘 *GENERAL* 〙',
      `│ • \`${prefix}menu\``,
      '└──────────────',
      '',
      '┌─ 〘 *DESCARGAS* 〙',
      `│ • \`${prefix}play <nombre>\` _selector_`,
      `│ • \`${prefix}ytmp3 <nombre/link>\``,
      `│ • \`${prefix}ytmp4 <nombre/link>\``,
      `│ • \`${prefix}tiktok <link>\``,
      `│ • \`${prefix}facebook <link>\``,
      `│ • \`${prefix}instagram <link>\``,
      `│ • \`${prefix}mediafire <link>\``,
      '└──────────────',
      '',
      '┌─ 〘 *SISTEMA* 〙',
      `│ • \`${prefix}infobot\``,
      `│ • \`${prefix}hora\``,
      `│ • \`${prefix}sistema\``,
      `│ • \`${prefix}speed\` / \`${prefix}internet\``,
      '└──────────────',
      '',
      '┌─ 〘 *GRUPOS* 〙',
      `│ • \`${prefix}antilink on/off\``,
      `│ • \`${prefix}modoadmin on/off\``,
      `│ • \`${prefix}grupo abrir/cerrar\``,
      `│ • \`${prefix}antiprivado on/off\``,
      '└──────────────',
      '',
      '┌─ 〘 *OWNER* 〙',
      `│ • \`${prefix}update\``,
      `│ • \`${prefix}setapi auto\``,
      '└──────────────',
      '',
      '✧ _Respuesta rápida, estable y elegante_ ✧',
      '❖ _Tip:_ usa *play* para selector de MP3/MP4',
    ];

    const menuVideo = 'https://raw.githubusercontent.com/DevYerZx/Hiyuki-Bot/main/videos-imagenes/menu.mp4';
    await client.sendMessage(m.key.remoteJid, {
      video: { url: menuVideo },
      gifPlayback: true,
      caption: lines.join('\n'),
    }, { quoted: m });
  },
};
