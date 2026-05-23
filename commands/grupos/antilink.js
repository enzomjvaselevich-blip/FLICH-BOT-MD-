module.exports = {
  command: ['antilink'],
  description: 'Activa o desactiva antilink en el grupo',
  categoria: 'grupos',
  admin: true,
  group: true,
  run: async (client, m, args, from, isCreator, ctx = {}) => {
    const mode = String(args[0] || '').toLowerCase();
    if (!['on', 'off', '1', '0'].includes(mode)) {
      await client.sendMessage(from, { text: 'Uso: .antilink on | off' }, { quoted: m });
      return;
    }

    const settings = ctx?.settings || {};
    const all = settings.groupOptions && typeof settings.groupOptions === 'object' ? settings.groupOptions : {};
    const current = all[from] || {};
    const enabled = mode === 'on' || mode === '1';
    all[from] = { ...current, antilink: enabled };
    ctx.saveSettings({ groupOptions: all });

    await client.sendMessage(from, { text: `✅ AntiLink ${enabled ? 'activado' : 'desactivado'} en este grupo.` }, { quoted: m });
  },
};
