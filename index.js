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
const DEFAULT_SETTINGS = {
  prefix: '.',
  ownerNumber: '51907376960',
  botNumber: '',
  authFolder: 'auth_info_baileys',
  pairingMode: 'qr',
  apiBaseUrl: 'https://dv-yer-api.online',
  apiKey: 'dvyer911840240197',
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

function loadSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
      return { ...DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    return { ...DEFAULT_SETTINGS, ...(parsed || {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(patch = {}) {
  settings = { ...DEFAULT_SETTINGS, ...settings, ...(patch || {}) };
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
}

function normalizeNumber(value = '') {
  return String(value || '').split('@')[0].split(':')[0].replace(/\D/g, '');
}

function isOwner(jid = '') {
  const sender = normalizeNumber(jid);
  return sender && (sender === normalizeNumber(settings.ownerNumber) || sender === normalizeNumber(settings.botNumber));
}

function getMessageText(msg = {}) {
  const m = msg.message || {};
  return m.conversation || m.extendedTextMessage?.text || '';
}

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (ans) => {
      rl.close();
      resolve(String(ans || '').trim());
    });
  });
}

function clearAuthFolder() {
  const folder = String(settings.authFolder || 'auth_info_baileys').trim();
  if (!folder) return;
  try { fs.rmSync(folder, { recursive: true, force: true }); } catch {}
  try { fs.mkdirSync(folder, { recursive: true }); } catch {}
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

async function startBot() {
  if (booting) return;
  booting = true;
  socketToken += 1;
  const token = socketToken;

  try {
    printBanner();

    reloadCommands();
    if (!normalizeNumber(settings.ownerNumber)) {
      saveSettings({ ownerNumber: DEFAULT_SETTINGS.ownerNumber });
    }

    const authFolder = String(settings.authFolder || 'auth_info_baileys').trim() || 'auth_info_baileys';
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
        console.log(paint('green', 'Conexion abierta correctamente.'));
        try {
          fs.mkdirSync(RUNTIME_DIR, { recursive: true });
          fs.writeFileSync(CONNECTED_FILE, JSON.stringify({ connected: true, at: Date.now() }, null, 2));
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

      const prefix = String(settings.prefix || '.').trim() || '.';
      const body = getMessageText(m).trim();
      if (!body.startsWith(prefix)) return;

      const args = body.slice(prefix.length).trim().split(/\s+/);
      const commandName = String(args.shift() || '').toLowerCase();
      const cmd = global.comandos?.get(commandName);
      if (!cmd) return;

      const from = m.key.remoteJid;
      const sender = m.key.participant || from;
      const place = String(from || '').endsWith('@g.us') ? 'GRUPO' : 'PRIVADO';
      const senderNum = normalizeNumber(sender) || 'desconocido';
      console.log(
        `${paint('dim', '[' + new Date().toLocaleTimeString('es-PE') + ']')} ` +
        `${paint('cyan', place)} ${paint('bold', prefix + commandName)} ` +
        `${paint('dim', 'from')} ${senderNum}`
      );

      if (cmd.isOwner && !isOwner(sender)) {
        await sock.sendMessage(from, { text: 'Solo el owner puede usar este comando.' }, { quoted: m });
        return;
      }

      await cmd.run(sock, m, args, from, isOwner(sender), {
        settings,
        saveSettings: (patch = {}) => saveSettings(patch),
        prefix,
        axios,
      });
    });
  } catch (err) {
    console.error('Error iniciando bot:', err);
    scheduleReconnect();
  } finally {
    booting = false;
  }
}

startBot().catch((err) => console.error('Error fatal:', err));
