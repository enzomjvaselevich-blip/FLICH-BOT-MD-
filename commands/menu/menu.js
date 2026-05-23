module.exports = {
  command: ['menu', 'help', 'comandos'],
  description: 'Muestra el menu de comandos',
  categoria: 'general',
  run: async (client, m) => {
    const prefix = process.env.BOT_PREFIX || '.';
    const lines = [
      '*HIYUKI BOT*',
      '',
      '*GENERAL*',
      `- ${prefix}menu`,
      '',
      '*OWNER*',
      `- ${prefix}update`,
    ];

    await client.sendMessage(m.key.remoteJid, { text: lines.join('\n') }, { quoted: m });
  },
};
