module.exports = {
  command: ['antiprivado', 'antiprivate'],
  description: 'Bloquea comandos en chat privado',
  categoria: 'grupos',
  isOwner: true,
  run: async (client, m, args, from, isCreator, ctx = {}) => {
    const mode = String(args[0] || '').toLowerCase();
    if (!['on', 'off', '1', '0'].includes(mode)) {
      await client.sendMessage(from, { text: 'Uso: .antiprivado on | off' }, { quoted: m });
      return;
    }

    const enabled = mode === 'on' || mode === '1';
    ctx.saveSettings({ antiPrivate: enabled });
    await client.sendMessage(from, { text: `✅ Anti-privado ${enabled ? 'activado' : 'desactivado'}.` }, { quoted: m });
  },
};
