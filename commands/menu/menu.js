module.exports = {
  command: ['menu', 'help', 'comandos'],
  description: 'Muestra el menu de comandos',
  categoria: 'general',
  run: async (client, m, args, from, isCreator, ctx = {}) => {
    const prefix = ctx?.prefix || '.';
    const lines = [
      '=== HIYUKI-BOT ===',
      '',
      '*GENERAL*',
      `- ${prefix}menu`,
      '',
      '*DESCARGAS*',
      `- ${prefix}play nombre cancion`,
      '',
      '*OWNER*',
      `- ${prefix}update`,
      `- ${prefix}setapi base <url>`,
      `- ${prefix}setapi key <apikey>`,
    ];

    await client.sendMessage(m.key.remoteJid, { text: lines.join('\n') }, { quoted: m });
  },
};
