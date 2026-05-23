module.exports = {
  command: ['modoadmin', 'soloadmin'],
  description: 'Solo administradores pueden usar comandos en el grupo',
  categoria: 'grupos',
  admin: true,
  group: true,
  run: async (client, m, args, from, isCreator, ctx = {}) => {
    const mode = String(args[0] || '').toLowerCase();
    if (!['on', 'off', '1', '0'].includes(mode)) {
      await client.sendMessage(from, { text: 'Uso: .modoadmin on | off' }, { quoted: m });
      return;
    }

    const settings = ctx?.settings || {};
    const all = settings.groupOptions && typeof settings.groupOptions === 'object' ? settings.groupOptions : {};
    const current = all[from] || {};
    const enabled = mode === 'on' || mode === '1';
    all[from] = { ...current, modoadmin: enabled };
    ctx.saveSettings({ groupOptions: all });

    await client.sendMessage(from, { text: `✅ Modo admin ${enabled ? 'activado' : 'desactivado'}.` }, { quoted: m });
  },
};
