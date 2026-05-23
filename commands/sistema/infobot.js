function fmtUptime(sec = 0) {
  const s = Math.max(0, Math.floor(Number(sec || 0)));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = [];
  if (d) r.push(`${d}d`);
  if (h || d) r.push(`${h}h`);
  r.push(`${m}m`);
  return r.join(' ');
}

function fmtMB(bytes = 0) {
  return `${(Number(bytes || 0) / 1024 / 1024).toFixed(1)} MB`;
}

module.exports = {
  command: ['infobot', 'botinfo', 'info'],
  description: 'Muestra informacion general del bot',
  categoria: 'sistema',
  run: async (client, m, args, from, isCreator, ctx = {}) => {
    const settings = ctx?.settings || {};
    const owner = String(settings.ownerNumber || '51907376960');
    const mem = process.memoryUsage();
    const text =
`╔════════════════════════════╗
║      *HIYUKI BOT INFO*     ║
╚════════════════════════════╝
🤖 Nombre: *HIYUKI-BOT*
👑 Owner: _${owner}_
🧷 Prefix: \`${settings.prefix || '.'}\`
⏱️ Uptime: *${fmtUptime(process.uptime())}*
🧠 RAM usada: *${fmtMB(mem.rss)}*
⚙️ Node: *${process.version}*`;

    await client.sendMessage(from, { text }, { quoted: m });
  },
};
