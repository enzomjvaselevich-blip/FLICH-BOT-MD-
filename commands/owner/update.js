const { exec } = require('child_process');
const { promisify } = require('util');
const { reloadCommands } = require('../../utils/reloadCommands');
const execAsync = promisify(exec);

async function sh(cmd) {
  const { stdout } = await execAsync(cmd, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 });
  return String(stdout || '').trim();
}

function pickCommandFiles(files = []) {
  return files.filter((f) => /^commands\/.+\.js$/i.test(String(f || '')));
}
function toShortList(files = [], max = 12) {
  if (!files.length) return '- Ninguno';
  const list = files.slice(0, max).map((f) => `- ${f}`);
  if (files.length > max) list.push(`- ... y ${files.length - max} mas`);
  return list.join('\n');
}

module.exports = {
  command: ['update', 'actualizar'],
  description: 'Actualiza desde GitHub y recarga comandos',
  isOwner: true,
  categoria: 'owner',
  run: async (client, m) => {
    await client.sendMessage(m.key.remoteJid, { text: 'Actualizando desde GitHub...' }, { quoted: m });

    try {
      const beforeHash = await sh('git rev-parse HEAD');
      const pullOut = await sh('git pull --ff-only');
      const afterHash = await sh('git rev-parse HEAD');
      reloadCommands();

      if (beforeHash === afterHash || /Already up to date\./i.test(pullOut)) {
        const line = '[UPDATE] Todo actualizado. No hay cambios nuevos.';
        console.log(line);
        await client.sendMessage(m.key.remoteJid, { text: '*Estado:* Todo actualizado.\nNo hubo cambios nuevos.' }, { quoted: m });
        return;
      }

      const changedRaw = await sh(`git diff --name-only ${beforeHash}..${afterHash}`);
      const changedFiles = changedRaw ? changedRaw.split('\n').map((x) => x.trim()).filter(Boolean) : [];
      const changedCommands = pickCommandFiles(changedFiles);
      const numstatRaw = await sh(`git diff --numstat ${beforeHash}..${afterHash}`);
      const numRows = numstatRaw ? numstatRaw.split('\n').map((x) => x.trim()).filter(Boolean) : [];
      let added = 0;
      let deleted = 0;
      for (const row of numRows) {
        const [a, d] = row.split('\t');
        added += Number.isFinite(Number(a)) ? Number(a) : 0;
        deleted += Number.isFinite(Number(d)) ? Number(d) : 0;
      }
      const commitInfo = await sh(`git log -1 --date=iso --format="%H|%ad|%an|%s" ${afterHash}`);
      const [hash, date, author, subject] = String(commitInfo || '').split('|');

      const commandLines = changedCommands.length
        ? changedCommands.map((f) => `- ${f}`).join('\n')
        : '- Ninguno';
      const filesLines = toShortList(changedFiles, 12);

      const msg =
`*Actualizacion completada*

*Commit aplicado:* ${hash || afterHash}
*Fecha del commit:* ${date || 'N/D'}
*Autor:* ${author || 'N/D'}
*Mensaje:* ${subject || 'N/D'}
*Resumen:* +${added} / -${deleted} lineas

*Comandos actualizados:*
${commandLines}

*Archivos actualizados:*
${filesLines}`;

      console.log('[UPDATE] Commit aplicado:', hash || afterHash);
      console.log('[UPDATE] Fecha:', date || 'N/D');
      console.log('[UPDATE] Autor:', author || 'N/D');
      console.log(`[UPDATE] Resumen: +${added} / -${deleted} lineas`);
      console.log('[UPDATE] Comandos actualizados:');
      if (changedCommands.length) {
        changedCommands.forEach((f) => console.log(` - ${f}`));
      } else {
        console.log(' - Ninguno');
      }
      console.log('[UPDATE] Archivos actualizados:');
      if (changedFiles.length) {
        changedFiles.slice(0, 12).forEach((f) => console.log(` - ${f}`));
        if (changedFiles.length > 12) console.log(` - ... y ${changedFiles.length - 12} mas`);
      } else {
        console.log(' - Ninguno');
      }

      await client.sendMessage(m.key.remoteJid, { text: msg }, { quoted: m });
    } catch (error) {
      const errMsg = String(error?.stderr || error?.message || error);
      console.log('[UPDATE] Error:', errMsg);
      await client.sendMessage(m.key.remoteJid, { text: `Error al actualizar:\n${errMsg}` }, { quoted: m });
    }
  },
};
