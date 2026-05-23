const fs = require('fs');
const path = require('path');
const pino = require('pino');
const readline = require('readline');
const { Boom } = require('@hapi/boom');
const axios = require('axios');

let makeWASocket;
let useMultiFileAuthState;
let fetchLatestBaileysVersion;
let DisconnectReason;

try {
  ({
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
  } = require('fsociety-Baileys'));
} catch (err) {
  console.log('No pude cargar fsociety-Baileys.');
  console.log(`Detalle: ${String(err?.message || err)}`);
  console.log('Ejecuta: npm install');
  process.exit(1);
}

const { reloadCommands } = require('./utils/reloadCommands');

const SETTINGS_FILE = path.join(process.cwd(), 'settings.json');
const SESSION_DIR = path.join(process.cwd(), 'session', 'Hiyuki-bot');

const MAIN_OWNER = '51907376960';
const EXTRA_OWNER = '51966440866';

const DEFAULT_SETTINGS = {
  prefix: '.',
  ownerNumber: [MAIN_OWNER, EXTRA_OWNER],
  botNumber: '51930108242',
  authFolder: SESSION_DIR,
  pairingMode: 'qr',
  apiBaseUrl: 'https://dv-yer-api.online',
  apiKey: 'dvyer911840240197',
  antiPrivate: false,
  groupOptions: {},
  antiLinkWarnings: {},
};

const RUNTIME_DIR = path.join(process.cwd(), 'runtime');
const CONNECTED_FILE = path.join(RUNTIME_DIR, 'connected.json');

let settings = loadSettings();
let booting = false;
let reconnectTimer = null;
let reconnectAttempts = 0;
let socketToken = 0;
let codeRequested = false;

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
};

function normalizeNumber(value = '') {
  if (Array.isArray(value)) return value.map(normalizeNumber).filter(Boolean);
  return String(value || '').split('@')[0].split(':')[0].replace(/\D/g, '');
}

function getOwnerNumbers() {
  const raw = settings.ownerNumbers || settings.ownerNumber || DEFAULT_SETTINGS.ownerNumber;
  const list = Array.isArray(raw) ? raw : [raw];

  const owners = [
    MAIN_OWNER,
    EXTRA_OWNER,
    ...list,
  ]
    .map((x) => normalizeNumber(x))
    .filter(Boolean);

  return [...new Set(owners)];
}

function loadSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
      return { ...DEFAULT_SETTINGS };
    }

    const parsed = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    const merged = { ...DEFAULT_SETTINGS, ...(parsed || {}) };

    if (!Array.isArray(merged.ownerNumber)) {
      merged.ownerNumber = [merged.ownerNumber].filter(Boolean);
    }

    if (!merged.ownerNumber.includes(EXTRA_OWNER)) {
      merged.ownerNumber.push(EXTRA_OWNER);
    }

    if (!merged.ownerNumber.includes(MAIN_OWNER)) {
      merged.ownerNumber.unshift(MAIN_OWNER);
    }

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2));
    return merged;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(patch = {}) {
  settings = { ...DEFAULT_SETTINGS, ...settings, ...(patch || {}) };

  if (!Array.isArray(settings.ownerNumber)) {
    settings.ownerNumber = [settings.ownerNumber].filter(Boolean);
  }

  if (!settings.ownerNumber.includes(MAIN_OWNER)) {
    settings.ownerNumber.unshift(MAIN_OWNER);
  }

  if (!settings.ownerNumber.includes(EXTRA_OWNER)) {
    settings.ownerNumber.push(EXTRA_OWNER);
  }

  settings.ownerNumber = [...new Set(settings.ownerNumber.map(normalizeNumber).filter(Boolean))];

  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  return settings;
}

function paint(color, text) {
  return `${C[color] || ''}${text}${C.reset}`;
}

function printBanner() {
  const line = paint('cyan', '========================================');
  const title = paint('bold', paint('magenta', '         HIYUKI-BOT | FSOCIETY'));

  console.log(line);
  console.log(title);
  console.log(line);
  console.log(`${paint('yellow', 'Owners:')} ${getOwnerNumbers().join(', ')}`);
  console.log(`${paint('yellow', 'Bot/lib:')} ${normalizeNumber(settings.botNumber || '-') || '-'}`);
  console.log(line);
}

function isOwner(jid = '') {
  const sender = normalizeNumber(jid);
  const botNumber = normalizeNumber(settings.botNumber || '');

  return Boolean(
    sender &&
    (
      getOwnerNumbers().includes(sender) ||
      sender === botNumber
    )
  );
}

function getGroupOptions(chatId = '') {
  const all = settings?.groupOptions && typeof settings.groupOptions === 'object'
    ? settings.groupOptions
    : {};
  return all[chatId] || {};
}

function normalizeUserJid(jid = '') {
  const user = String(jid || '').split(':')[0];
  if (!user) return '';
  if (user.endsWith('@s.whatsapp.net')) return user;
  return `${user.replace(/@.+$/, '')}@s.whatsapp.net`;
}

function getMessageText(msg = {}) {
  const m = msg.message || {};

  const fromText =
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    '';

  if (fromText) return fromText;

  const selectedId =
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.templateButtonReplyMessage?.selectedId ||
    '';

  if (selectedId) return selectedId;

  const paramsJson = m.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;

  if (paramsJson) {
    try {
      const parsed = JSON.parse(paramsJson);
      return parsed?.id || parsed?.selectedId || '';
    } catch {
      return '';
    }
  }

  return '';
}

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (ans) => {
      rl.close();
      resolve(String(ans || '').trim());
    });
  });
}

function clearAuthFolder() {
  const folder = SESSION_DIR;
  if (!folder) return;

  try {
    fs.rmSync(folder, { recursive: true, force: true });
  } catch {}

  try {
    fs.mkdirSync(folder, { recursive: true });
  } catch {}
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensurePairingConfig() {
  saveSettings({ pairingMode: 'qr' });
  console.log('Modo QR activo. Escanea el QR de la consola.');
}

function scheduleReconnect() {
  if (reconnectTimer) return;

  reconnectAttempts += 1;
  const waitMs = Math.min(15000, 2000 + reconnectAttempts * 1200);

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    startBot().catch((err) => console.error('Error al reconectar:', err));
  }, waitMs);
}

async function requestCodeWithRetry(sock, number) {
  for (let i = 1; i <= 8; i += 1) {
    try {
      await delay(900 * i);
      return await sock.requestPairingCode(number);
    } catch (e) {
      const code = Number(e?.output?.statusCode || 0);
      const retryable = code === 428 || code === 408 || code === 401;

      if (!retryable || i === 8) throw e;

      console.log(`Reintento codigo ${i} (${code || 'sin-codigo'})...`);
      await delay(1200 * i);
    }
  }

  throw new Error('No pude obtener codigo.');
}

function getPrefixList() {
  const raw = settings.prefix || '.';

  if (Array.isArray(raw)) {
    return raw.map((x) => String(x || '').trim()).filter(Boolean);
  }

  return [String(raw || '.').trim() || '.'];
}

function getUsedPrefix(body = '') {
  const prefixes = getPrefixList();
  return prefixes.find((p) => body.startsWith(p)) || '';
}

async function startBot() {
  if (booting) return;

  booting = true;
  socketToken += 1;

  const token = socketToken;

  try {
    saveSettings({
      ownerNumber: getOwnerNumbers(),
      authFolder: SESSION_DIR,
    });

    printBanner();

    reloadCommands();

    if (!String(settings.apiBaseUrl || '').trim() || !String(settings.apiKey || '').trim()) {
      saveSettings({
        apiBaseUrl: DEFAULT_SETTINGS.apiBaseUrl,
        apiKey: DEFAULT_SETTINGS.apiKey,
      });
    }

    const authFolder = SESSION_DIR;
    fs.mkdirSync(authFolder, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);

    if (!state?.creds?.registered) {
      await ensurePairingConfig();
      codeRequested = false;
    }

    const { version } = await fetchLatestBaileysVersion();
    const isQrMode = true;

    const sock = makeWASocket({
      version,
      printQRInTerminal: !state?.creds?.registered && isQrMode,
      logger: pino({ level: 'silent' }),
      auth: state,
      browser: ['HIYUKI-BOT', 'Chrome', '1.0.0'],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
      if (token !== socketToken) return;

      if (connection === 'open') {
        reconnectAttempts = 0;

        const me = normalizeNumber(sock?.user?.id || '');

        if (me && normalizeNumber(settings.botNumber) !== me) {
          saveSettings({ botNumber: me });
        }

        console.log(`${paint('yellow', 'Bot/lib activo:')} ${me || 'desconocido'}`);
        console.log(paint('green', 'Conexion abierta correctamente.'));

        try {
          fs.mkdirSync(RUNTIME_DIR, { recursive: true });
          fs.writeFileSync(
            CONNECTED_FILE,
            JSON.stringify(
              {
                connected: true,
                at: Date.now(),
                owners: getOwnerNumbers(),
                botNumber: me || normalizeNumber(settings.botNumber || ''),
              },
              null,
              2
            )
          );
        } catch {}

        if (!sock.authState.creds.registered && !isQrMode && !codeRequested) {
          codeRequested = true;

          try {
            const number = normalizeNumber(settings.botNumber || '');
            const code = await requestCodeWithRetry(sock, number);

            console.log('========================================');
            console.log(`Codigo de vinculacion: ${code}`);
            console.log('WhatsApp > Dispositivos vinculados > Vincular con numero');
            console.log('========================================');
          } catch (e) {
            codeRequested = false;
            console.log(`No pude generar codigo: ${String(e?.message || e)}`);
          }
        }

        return;
      }

      if (connection === 'close') {
        const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode || 0;

        console.log(paint('yellow', `Conexion cerrada (${statusCode}). Reintentando...`));

        if (statusCode === 401 && !sock.authState?.creds?.registered) {
          console.log(paint('red', 'Sesion previa invalida detectada, limpiando auth...'));
          clearAuthFolder();
        }

        if (statusCode !== DisconnectReason.loggedOut) {
          scheduleReconnect();
        }
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (token !== socketToken) return;
      if (type !== 'notify') return;

      const m = messages?.[0];

      if (!m || m.key.fromMe) return;

      const from = m.key.remoteJid;
      const sender = m.key.participant || from;
      const body = getMessageText(m).trim();
      const isGroup = String(from || '').endsWith('@g.us');
      const groupOpts = isGroup ? getGroupOptions(from) : {};

      let metadata = null;
      let senderIsAdmin = false;

      if (isGroup && (groupOpts.antilink || groupOpts.modoadmin)) {
        try {
          metadata = await sock.groupMetadata(from);
          const p = (metadata?.participants || []).find((x) => x.id === sender);
          senderIsAdmin = Boolean(p?.admin);
        } catch {}
      }

      if (!isGroup && settings.antiPrivate && !isOwner(sender)) return;

      if (
        isGroup &&
        groupOpts.antilink &&
        /(chat\.whatsapp\.com\/|whatsapp\.com\/channel\/)/i.test(body)
      ) {
        if (!isOwner(sender) && !senderIsAdmin) {
          const userJid = normalizeUserJid(sender);

          const allWarns =
            settings?.antiLinkWarnings && typeof settings.antiLinkWarnings === 'object'
              ? settings.antiLinkWarnings
              : {};

          const groupWarns =
            allWarns[from] && typeof allWarns[from] === 'object'
              ? allWarns[from]
              : {};

          const current = Number(groupWarns[userJid] || 0);
          const next = current + 1;

          groupWarns[userJid] = next;
          allWarns[from] = groupWarns;

          saveSettings({ antiLinkWarnings: allWarns });

          try {
            await sock.sendMessage(from, { delete: m.key });
          } catch {}

          if (next >= 3) {
            delete groupWarns[userJid];
            allWarns[from] = groupWarns;

            saveSettings({ antiLinkWarnings: allWarns });

            await sock.sendMessage(
              from,
              {
                text: `🚫 @${normalizeNumber(sender)} alcanzó *3/3 advertencias* por enlaces de WhatsApp y será expulsado.`,
                mentions: [sender],
              },
              { quoted: m }
            );

            try {
              await sock.groupParticipantsUpdate(from, [userJid], 'remove');
            } catch {}
          } else {
            await sock.sendMessage(
              from,
              {
                text: `⚠️ @${normalizeNumber(sender)} enlace de WhatsApp detectado.\nAdvertencia: *${next}/3*`,
                mentions: [sender],
              },
              { quoted: m }
            );
          }

          return;
        }
      }

      const usedPrefix = getUsedPrefix(body);
      if (!usedPrefix) return;

      const args = body.slice(usedPrefix.length).trim().split(/\s+/);
      const commandName = String(args.shift() || '').toLowerCase();

      if (!commandName) return;

      const cmd = global.comandos?.get(commandName);
      if (!cmd) return;

      const place = isGroup ? 'GRUPO' : 'PRIVADO';
      const senderNum = normalizeNumber(sender) || 'desconocido';

      console.log(
        `${paint('dim', '[' + new Date().toLocaleTimeString('es-PE') + ']')} ` +
        `${paint('cyan', place)} ${paint('bold', usedPrefix + commandName)} ` +
        `${paint('dim', 'from')} ${senderNum}`
      );

      const senderIsOwner = isOwner(sender);

      if (cmd.isOwner && !senderIsOwner) {
        await sock.sendMessage(
          from,
          { text: 'Solo el owner puede usar este comando.' },
          { quoted: m }
        );
        return;
      }

      if (cmd.group && !isGroup) {
        await sock.sendMessage(
          from,
          { text: 'Este comando solo funciona en grupos.' },
          { quoted: m }
        );
        return;
      }

      if (cmd.admin) {
        if (!isGroup) {
          await sock.sendMessage(
            from,
            { text: 'Este comando requiere grupo y admin.' },
            { quoted: m }
          );
          return;
        }

        if (!metadata) {
          try {
            metadata = await sock.groupMetadata(from);
            const p = (metadata?.participants || []).find((x) => x.id === sender);
            senderIsAdmin = Boolean(p?.admin);
          } catch {}
        }

        if (!senderIsOwner && !senderIsAdmin) {
          await sock.sendMessage(
            from,
            { text: 'Solo administradores pueden usar este comando.' },
            { quoted: m }
          );
          return;
        }
      }

      if (isGroup && groupOpts.modoadmin && !senderIsOwner && !senderIsAdmin) {
        return;
      }

      try {
        await cmd.run(sock, m, args, from, senderIsOwner, {
          settings,
          saveSettings: (patch = {}) => saveSettings(patch),
          prefix: usedPrefix,
          prefixes: getPrefixList(),
          axios,
          isOwner,
          ownerNumbers: getOwnerNumbers(),
        });
      } catch (err) {
        console.error(`Error en comando ${commandName}:`, err);

        await sock.sendMessage(
          from,
          {
            text:
              '╭━━〔 ❌ *ERROR* 〕━━⬣\n' +
              '┃ Ocurrió un error ejecutando el comando.\n' +
              '┃ Revisa la consola del bot.\n' +
              '╰━━━━━━━━━━━━━━━━━━⬣',
          },
          { quoted: m }
        );
      }
    });
  } catch (err) {
    console.error('Error iniciando bot:', err);
    scheduleReconnect();
  } finally {
    booting = false;
  }
}

startBot().catch((err) => console.error('Error fatal:', err));