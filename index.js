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

let loadError = null;
try {
  ({
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
  } = require('fsociety-Baileys'));
} catch (err1) {
  loadError = err1;
  try {
    ({
      default: makeWASocket,
      useMultiFileAuthState,
      fetchLatestBaileysVersion,
      DisconnectReason,
    } = require('baileys-fsociety'));
  } catch (err2) {
    loadError = err2 || loadError;
    console.log('No pude cargar tu Baileys personalizado.');
    if (loadError?.message) {
      console.log(`Detalle: ${loadError.message}`);
    }
    console.log('Ejecuta: npm install');
    console.log('Si sigue igual, ejecuta: rm -rf node_modules package-lock.json && npm install');
    process.exit(1);
  }
}

const { reloadCommands } = require('./utils/reloadCommands');

const SETTINGS_FILE = path.join(process.cwd(), 'settings.json');
const DEFAULT_SETTINGS = {
  prefix: '.',
  ownerNumber: '',
  botNumber: '',
  authFolder: 'auth_info_baileys',
  apiBaseUrl: '',
  apiKey: '',
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

function saveSettings(nextSettings = {}) {
  const safe = { ...DEFAULT_SETTINGS, ...(nextSettings || {}) };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(safe, null, 2));
  return safe;
}

let settings = loadSettings();

function normalizeNumber(value = '') {
  return String(value || '').split('@')[0].split(':')[0].replace(/\D/g, '');
}

function getMessageText(msg = {}) {
  const m = msg.message || {};
  return m.conversation || m.extendedTextMessage?.text || '';
}

function askQuestion(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

let promptRunning = false;
let reconnectTimer = null;
let reconnectAttempts = 0;
let activeSocket = null;
let pairingInProgress = false;

async function getPairingTargetNumber() {
  const savedNumber = normalizeNumber(settings.botNumber || '');
  if (savedNumber) return savedNumber;

  if (promptRunning) {
    throw new Error('Ya hay una solicitud de numero en progreso.');
  }

  promptRunning = true;
  const input = await askQuestion('Numero para vincular (ej: 51912345678): ');
  promptRunning = false;
  const parsed = String(input || '').replace(/\D/g, '');
  if (!parsed) throw new Error('Numero invalido.');

  settings = saveSettings({
    ...settings,
    botNumber: parsed,
    ownerNumber: normalizeNumber(settings.ownerNumber || '') || parsed,
  });

  return parsed;
}

function isOwner(jid = '') {
  const sender = normalizeNumber(jid);
  if (!sender) return false;

  const owner = normalizeNumber(settings.ownerNumber || '');
  const bot = normalizeNumber(settings.botNumber || '');
  return sender === owner || sender === bot;
}

function buildBanner() {
  return [
    '========================================',
    '         HIYUKI-BOT | FSOCIETY',
    '========================================',
  ].join('\n');
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectAttempts += 1;
  const waitMs = Math.min(15_000, 1500 + reconnectAttempts * 1200);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    startBot().catch((err) => console.error('Error reiniciando bot:', err));
  }, waitMs);
}

function clearAuthFolder(targetFolder = '') {
  const folder = String(targetFolder || '').trim();
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

function waitForConnectionOpen(sock, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      reject(new Error('Timeout esperando conexion abierta.'));
    }, Math.max(5000, Number(timeoutMs || 25000)));

    const onUpdate = ({ connection, lastDisconnect }) => {
      if (done) return;
      if (connection === 'open') {
        done = true;
        clearTimeout(timer);
        sock.ev.off('connection.update', onUpdate);
        resolve(true);
        return;
      }

      if (connection === 'close') {
        const code = new Boom(lastDisconnect?.error)?.output?.statusCode || 0;
        done = true;
        clearTimeout(timer);
        sock.ev.off('connection.update', onUpdate);
        reject(new Error(`Conexion cerrada mientras esperaba open (${code})`));
      }
    };

    sock.ev.on('connection.update', onUpdate);
  });
}

async function requestPairingCodeWithRetry(sock, number, maxAttempts = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await waitForConnectionOpen(sock, 30000);
      const code = await sock.requestPairingCode(number);
      return code;
    } catch (error) {
      lastError = error;
      const statusCode = Number(error?.output?.statusCode || error?.data?.statusCode || 0);
      const canRetry =
        statusCode === 428 ||
        /Connection Closed|Precondition Required|closed/i.test(String(error?.message || ''));

      if (!canRetry || attempt >= maxAttempts) {
        break;
      }

      console.log(`Pairing intento ${attempt} fallo (${statusCode || 'sin-codigo'}). Reintentando...`);
      await delay(1800 * attempt);
    }
  }

  throw lastError || new Error('No pude obtener codigo de vinculacion.');
}

async function startBot() {
  console.log(buildBanner());
  reloadCommands();

  const authFolder = String(settings.authFolder || 'auth_info_baileys').trim() || 'auth_info_baileys';
  const prefix = String(settings.prefix || '.').trim() || '.';
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    auth: state,
    browser: ['HIYUKI BOT', 'Chrome', '1.0.0'],
  });
  activeSocket = sock;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      console.log('Bot conectado.');
      reconnectAttempts = 0;
      return;
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (statusCode === 401 && !sock.authState?.creds?.registered) {
        console.log('Detecte 401 antes de vincular. Limpio auth y reintento automaticamente...');
        clearAuthFolder(authFolder);
      }
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) scheduleReconnect();
      return;
    }
  });

  if (!sock.authState.creds.registered) {
    if (!pairingInProgress) {
      pairingInProgress = true;
      try {
        const number = await getPairingTargetNumber();
        const code = await requestPairingCodeWithRetry(sock, number, 3);
        console.log(`Codigo de vinculacion: ${code}`);
        console.log('WhatsApp > Dispositivos vinculados > Vincular con numero');
      } catch (error) {
        console.log('No pude generar codigo por numero en este intento.');
        console.log(`Detalle: ${String(error?.message || error)}`);
        console.log('Fallback activo: escanea el QR en consola para vincular.');
      } finally {
        pairingInProgress = false;
      }
    }
  }

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const m = messages?.[0];
    if (!m || m.key.fromMe) return;

    const body = getMessageText(m).trim();
    if (!body.startsWith(prefix)) return;

    const args = body.slice(prefix.length).trim().split(/\s+/);
    const commandName = String(args.shift() || '').toLowerCase();
    const cmd = global.comandos?.get(commandName);
    if (!cmd) return;

    const from = m.key.remoteJid;
    const sender = m.key.participant || from;

    if (cmd.isOwner && !isOwner(sender)) {
      await sock.sendMessage(from, { text: 'Solo el owner puede usar este comando.' }, { quoted: m });
      return;
    }

    await cmd.run(sock, m, args, from, isOwner(sender), {
      settings,
      saveSettings: (patch = {}) => {
        settings = saveSettings({ ...settings, ...(patch || {}) });
        return settings;
      },
      prefix,
      axios,
    });
  });
}

startBot().catch((err) => console.error('Error iniciando bot:', err));
