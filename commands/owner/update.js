const { exec } = require('child_process');
const { promisify } = require('util');
const { reloadCommands } = require('../../utils/reloadCommands');

const execAsync = promisify(exec);

const MAX_BUFFER = 1024 * 1024 * 20;
const TIMEOUT = 1000 * 60 * 2;

async function sh(cmd) {
  const { stdout } = await execAsync(cmd, {
    cwd: process.cwd(),
    maxBuffer: MAX_BUFFER,
    timeout: TIMEOUT,
  });

  return String(stdout || '').trim();
}

function cleanText(text = '') {
  return String(text || '')
    .replace(/\r/g, '')
    .replace(/[^\S\n]+/g, ' ')
    .trim();
}

function shortHash(hash = '') {
  return String(hash || '').slice(0, 8) || 'N/D';
}

function pickCommandFiles(files = []) {
  return files.filter((f) => /^commands\/.+\.js$/i.test(String(f || '')));
}

function pickImportantFiles(files = []) {
  return files.filter((f) => {
    const file = String(f || '').toLowerCase();

    return (
      file === 'index.js' ||
      file === 'package.json' ||
      file === 'settings.json' ||
      file.includes('handler') ||
      file.includes('config') ||
      file.startsWith('lib/') ||
      file.startsWith('utils/') ||
      file.startsWith('commands/')
    );
  });
}

function toShortList(files = [], max = 12) {
  if (!files.length) return '┃  └─ Ninguno';

  const list = files.slice(0, max).map((f, i) => {
    const isLast = i === Math.min(files.length, max) - 1 && files.length <= max;
    return `┃  ${isLast ? '└─' : '├─'} ${f}`;
  });

  if (files.length > max) {
    list.push(`┃  └─ ... y ${files.length - max} más`);
  }

  return list.join('\n');
}

function parseNumstat(numstatRaw = '') {
  const rows = cleanText(numstatRaw)
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);

  let added = 0;
  let deleted = 0;

  for (const row of rows) {
    const [a, d] = row.split(/\s+/);

    if (/^\d+$/.test(a)) added += Number(a);
    if (/^\d+$/.test(d)) deleted += Number(d);
  }

  return { added, deleted };
}

function buildProgressMessage() {
  return (
    '╭━━〔 🔄 *HIYUKI UPDATE* 〕━━⬣\n' +
    '┃ Estado: *Actualizando desde GitHub...*\n' +
    '┃ Acción: `git pull --ff-only`\n' +
    '┃ Espera unos segundos.\n' +
    '╰━━━━━━━━━━━━━━━━━━━━━━⬣'
  );
}

function buildNoChangesMessage(hash) {
  return (
    '╭━━〔 ✅ *HIYUKI UPDATE* 〕━━⬣\n' +
    '┃ Estado: *Todo actualizado*\n' +
    `┃ Commit actual: \`${shortHash(hash)}\`\n` +
    '┃ Cambios nuevos: *0*\n' +
    '┃ Comandos recargados: *Sí*\n' +
    '╰━━━━━━━━━━━━━━━━━━━━━━⬣'
  );
}

function buildSuccessMessage(data = {}) {
  const {
    beforeHash,
    afterHash,
    date,
    author,
    subject,
    added,
    deleted,
    changedFiles,
    changedCommands,
    importantFiles,
  } = data;

  return (
    '╭━━〔 ✅ *HIYUKI UPDATE* 〕━━⬣\n' +
    '┃ Estado: *Actualización completada*\n' +
    `┃ Antes: \`${shortHash(beforeHash)}\`\n` +
    `┃ Ahora: \`${shortHash(afterHash)}\`\n` +
    `┃ Autor: *${author || 'N/D'}*\n` +
    `┃ Fecha: ${date || 'N/D'}\n` +
    `┃ Resumen: *+${added} / -${deleted} líneas*\n` +
    `┃ Archivos: *${changedFiles.length}*\n` +
    `┃ Comandos: *${changedCommands.length}*\n` +
    '╰━━━━━━━━━━━━━━━━━━━━━━⬣\n\n' +

    '╭━━〔 🧾 *ÚLTIMO COMMIT* 〕━━⬣\n' +
    `┃ ${subject || 'Sin mensaje'}\n` +
    '╰━━━━━━━━━━━━━━━━━━━━━━⬣\n\n' +

    '╭━━〔 ⚙️ *COMANDOS ACTUALIZADOS* 〕━━⬣\n' +
    `${toShortList(changedCommands, 10)}\n` +
    '╰━━━━━━━━━━━━━━━━━━━━━━⬣\n\n' +

    '╭━━〔 📁 *ARCHIVOS IMPORTANTES* 〕━━⬣\n' +
    `${toShortList(importantFiles, 12)}\n` +
    '╰━━━━━━━━━━━━━━━━━━━━━━⬣'
  );
}

function buildErrorMessage(error) {
  const raw = String(error?.stderr || error?.stdout || error?.message || error || 'Error desconocido');
  const msg = cleanText(raw).slice(0, 1500);

  return (
    '╭━━〔 ❌ *HIYUKI UPDATE ERROR* 〕━━⬣\n' +
    '┃ No se pudo actualizar el bot.\n' +
    '┃ Revisa el error abajo:\n' +
    '╰━━━━━━━━━━━━━━━━━━━━━━⬣\n\n' +
    '```' +
    '\n' +
    msg +
    '\n' +
    '```'
  );
}

module.exports = {
  command: ['update', 'actualizar', 'gitpull'],
  description: 'Actualiza el bot desde GitHub y recarga comandos',
  isOwner: true,
  categoria: 'owner',

  run: async (client, m) => {
    const jid = m.key.remoteJid;

    await client.sendMessage(
      jid,
      { text: buildProgressMessage() },
      { quoted: m }
    );

    try {
      const beforeHash = await sh('git rev-parse HEAD');

      let pullOut = '';

      try {
        pullOut = await sh('git pull --ff-only');
      } catch (pullError) {
        const rawError = String(pullError?.stderr || pullError?.stdout || pullError?.message || pullError);

        if (/would be overwritten by merge|local changes/i.test(rawError)) {
          throw new Error(
            'Tienes cambios locales sin guardar.\n\n' +
            'Solución manual:\n' +
            'git status\n' +
            'git add .\n' +
            'git commit -m "backup cambios locales"\n' +
            'git pull --ff-only\n\n' +
            'O si quieres borrar cambios locales:\n' +
            'git reset --hard\n' +
            'git pull --ff-only'
          );
        }

        throw pullError;
      }

      const afterHash = await sh('git rev-parse HEAD');

      try {
        reloadCommands();
      } catch (reloadError) {
        console.log('[UPDATE] Error recargando comandos:', reloadError);
      }

      if (beforeHash === afterHash || /already up to date/i.test(pullOut)) {
        console.log('[UPDATE] Todo actualizado. No hay cambios nuevos.');

        await client.sendMessage(
          jid,
          { text: buildNoChangesMessage(afterHash) },
          { quoted: m }
        );

        return;
      }

      const changedRaw = await sh(`git diff --name-only ${beforeHash}..${afterHash}`);

      const changedFiles = changedRaw
        ? changedRaw.split('\n').map((x) => x.trim()).filter(Boolean)
        : [];

      const changedCommands = pickCommandFiles(changedFiles);
      const importantFiles = pickImportantFiles(changedFiles);

      const numstatRaw = await sh(`git diff --numstat ${beforeHash}..${afterHash}`);
      const { added, deleted } = parseNumstat(numstatRaw);

      const commitInfo = await sh(`git log -1 --date=iso --format="%H|%ad|%an|%s" ${afterHash}`);
      const [hash, date, author, subject] = String(commitInfo || '').split('|');

      const finalHash = hash || afterHash;

      console.log('╭━━〔 UPDATE COMPLETADO 〕━━⬣');
      console.log(`┃ Antes: ${shortHash(beforeHash)}`);
      console.log(`┃ Ahora: ${shortHash(finalHash)}`);
      console.log(`┃ Autor: ${author || 'N/D'}`);
      console.log(`┃ Fecha: ${date || 'N/D'}`);
      console.log(`┃ Resumen: +${added} / -${deleted} líneas`);
      console.log(`┃ Archivos: ${changedFiles.length}`);
      console.log(`┃ Comandos: ${changedCommands.length}`);
      console.log('╰━━━━━━━━━━━━━━━━━━━━━━⬣');

      const msg = buildSuccessMessage({
        beforeHash,
        afterHash: finalHash,
        date,
        author,
        subject,
        added,
        deleted,
        changedFiles,
        changedCommands,
        importantFiles,
      });

      await client.sendMessage(
        jid,
        { text: msg },
        { quoted: m }
      );
    } catch (error) {
      console.log('[UPDATE] Error:', String(error?.stderr || error?.message || error));

      await client.sendMessage(
        jid,
        { text: buildErrorMessage(error) },
        { quoted: m }
      );
    }
  },
};