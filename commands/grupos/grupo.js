module.exports = {
  command: ['grupo', 'cerrar', 'abrir'],
  description: 'Abrir o cerrar grupo',
  categoria: 'grupos',
  admin: true,
  group: true,
  run: async (client, m, args, from) => {
    let action = String(args[0] || '').toLowerCase();
    const rawCmd = String(m?.message?.conversation || m?.message?.extendedTextMessage?.text || '').toLowerCase();

    if (rawCmd.startsWith('.cerrar')) action = 'cerrar';
    if (rawCmd.startsWith('.abrir')) action = 'abrir';

    if (!['abrir', 'cerrar', 'open', 'close'].includes(action)) {
      await client.sendMessage(from, { text: 'Uso: .grupo abrir | cerrar' }, { quoted: m });
      return;
    }

    const close = action === 'cerrar' || action === 'close';
    await client.groupSettingUpdate(from, close ? 'announcement' : 'not_announcement');
    await client.sendMessage(from, { text: `✅ Grupo ${close ? 'cerrado' : 'abierto'} correctamente.` }, { quoted: m });
  },
};
