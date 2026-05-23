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
      '╔════════════════════════════╗',
      '║       HIYUKI-BOT  華       ║',
      '╚════════════════════════════╝',
      '',
      '┌─ 〘 ESTADO 〙',
      `│ Prefix: ${prefix}`,
      `│ API: ${apiReady ? 'Activa' : 'Pendiente'}`,
      `│ Owner: ${owner}`,
      '└──────────────',
      '',
      '┌─ 〘 GENERAL 〙',
      `│ ${prefix}menu`,
      '└──────────────',
      '',
      '┌─ 〘 DESCARGAS 〙',
      `│ ${prefix}play <nombre/link>`,
      `│ ${prefix}ytmp4 <nombre/link>`,
      `│ ${prefix}tiktok <link>`,
      `│ ${prefix}facebook <link>`,
      `│ ${prefix}instagram <link>`,
      `│ ${prefix}mediafire <link>`,
      '└──────────────',
      '',
      '┌─ 〘 OWNER 〙',
      `│ ${prefix}update`,
      `│ ${prefix}setapi auto`,
      '└──────────────',
      '',
      '✦ Respuesta rapida y estable para descargas ✦',
    ];

    await client.sendMessage(m.key.remoteJid, { text: lines.join('\n') }, { quoted: m });
  },
};
