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
  console.log('No pude cargar tu Baileys personalizado.');
  console.log(`Detalle: ${String(err?.message || err)}`);
  console.log('Ejecuta: npm install');
  process.exit(1);
}

const { reloadCommands } = require('./utils/reloadCommands');

const SETTINGS_FILE = path.join(process.cwd(), 'settings.json');
const DEFAULT_SETTINGS = {
  prefix: '.',
  ownerNumber: '',
  botNumber: '',
  authFolder: 'auth_info_baileys',
  pairingMode: 'codigo',
  apiBaseUrl: '',
  apiKey: '',
};

const RUNTIME_DIR = path.join(process.cwd(), 'runtime');
const CONNECTED_STATE_FILE = path.join(RUNTIME_DIR, 'last-connected.json');

let settings = loadSettings();
let startupRunning = false;
let bannerPrinted = false;
let reconnectTimer = null;
let reconnectAttempts = 0;
let pairPromptInProgress = false;
let sessionToken = 0;

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

function ensureDir(dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch {}
}

function writeConnectedState(payload = {}) {
  ensureDir(RUNTIME_DIR);
  try {
    fs.writeFileSync(CONNECTED_STATE_FILE, JSON.stringify(payload, null, 2));
  } catch {}
}

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

function buildBanner() {
  return [
    '========================================',
    '         HIYUKI-BOT | FSOCIETY',
    '========================================',
  ].join('\n');
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

function isOwner(jid = '') {
  const sender = normalizeNumber(jid);
  if (!sender) return false;
  const owner = normalizeNumber(settings.ownerNumber || '');
  const bot = normalizeNumber(settings.botNumber || '');
  return sender === owner || sender === bot;
}

async function getPairingMode() {
  const saved = String(settings.pairingMode || 'codigo').toLowerCase();

  if (pairPromptInProgress) return saved === 'qr' ? 'qr' : 'codigo';

  pairPromptInProgress = true;
  try {
    const input = await askQuestion(
      `Modo de vinculacion [codigo/qr] (actual ${saved}, Enter para usarlo): `
    );
    const normalized = String(input || '').trim().toLowerCase();
    const mode = normalized || saved;
    const finalMode = mode === 'qr' ? 'qr' : 'codigo';

    settings = saveSettings({
      ...settings,
      pairingMode: finalMode,
    });

    return finalMode;
  } finally {
    pairPromptInProgress = false;
  }
}

async function getPairingTargetNumber() {
  const savedNumber = normalizeNumber(settings.botNumber || '');

  if (pairPromptInProgress) {
    return savedNumber;
  }

  pairPromptInProgress = true;
  try {
    const promptLabel = savedNumber
      ? `Numero para vincular (actual ${savedNumber}, Enter para usarlo): `
      : 'Numero para vincular (ej: 51912345678): ';

    const input = await askQuestion(promptLabel);
    const parsed = String(input || '').replace(/\D/g, '') || savedNumber;
    if (!parsed) throw new Error('Numero invalido.');

    settings = saveSettings({
      ...settings,
      botNumber: parsed,
      ownerNumber: normalizeNumber(settings.ownerNumber || '') || parsed,
    });

    return parsed;
  } finally {
    pairPromptInProgress = false;
  }
}

async function requestPairingCodeWithRetry(sock, number, maxAttempts = 8) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await delay(1000 * attempt);
      const code = await sock.requestPairingCode(number);
      return code;
    } catch (error) {
      lastError = error;
      const statusCode = Number(error?.output?.statusCode || error?.data?.statusCode || 0);
      const canRetry =
        statusCode === 428 ||
        statusCode === 401 ||
        statusCode === 408 ||
        /Connection Closed|Precondition Required|closed/i.test(String(error?.message || ''));

      if (!canRetry || attempt >= maxAttempts) break;

      console.log(`Pairing intento ${attempt} fallo (${statusCode || 'sin-codigo'}). Reintentando...`);
      await delay(1500 * attempt);
    }
  }

  throw lastError || new Error('No pude obtener codigo de vinculacion.');
}

function scheduleReconnect() {
  if (reconnectTimer) return;

  reconnectAttempts += 1;
  const waitMs = Math.min(15000, 2000 + reconnectAttempts * 1200);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    startBot().catch((err) => console.error('Error reiniciando bot:', err));
  }, waitMs);
}

async function startBot() {
  if (startupRunning) return;
  startupRunning = true;
  sessionToken += 1;
  const localToken = sessionToken;

  try {
    if (!bannerPrinted) {
      bannerPrinted = true;
      console.log(buildBanner());
    }

    reloadCommands();

    const authFolder = String(settings.authFolder || 'auth_info_baileys').trim() || 'auth_info_baileys';
    const prefix = String(settings.prefix || '.').trim() || '.';
    ensureDir(authFolder);

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion();

    let pairingMode = String(settings.pairingMode || 'codigo').toLowerCase();
    let pairingNumber = '';

    if (!state?.creds?.registered) {
      pairingMode = await getPairingMode();
      console.log(`Modo de vinculacion activo: ${pairingMode.toUpperCase()}`);

      if (pairingMode === 'codigo') {
        pairingNumber = await getPairingTargetNumber();
        console.log(`Numero objetivo para vinculacion: ${pairingNumber}`);
      } else {
        console.log('Escanea el QR dentro de los proximos 30 segundos.');
      }
    }

    const sock = makeWASocket({
      version,
      printQRInTerminal: !state?.creds?.registered && pairingMode === 'qr',
      logger: pino({ level: 'silent' }),
      auth: state,
      browser: ['HIYUKI BOT', 'Chrome', '1.0.0'],
    });

    sock.ev.on('creds.update', saveCreds);

    let codeDelivered = false;
    let codeRequestRunning = false;

    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
      if (localToken !== sessionToken) return;

      if (
        connection === 'open' &&
        pairingMode === 'codigo' &&
        !sock.authState.creds.registered &&
        pairingNumber &&
        !codeDelivered &&
        !codeRequestRunning
      ) {
        codeRequestRunning = true;
        try {
          const code = await requestPairingCodeWithRetry(sock, pairingNumber, 8);
          codeDelivered = true;
          console.log('========================================');
          console.log('CODIGO DE VINCULACION (NUMERO)');
          console.log(`Numero: ${pairingNumber}`);
          console.log(`Codigo: ${code}`);
          console.log('========================================');
          console.log('WhatsApp > Dispositivos vinculados > Vincular con numero');
        } catch (error) {
          console.log('No pude generar codigo por numero en este intento.');
          console.log(`Detalle: ${String(error?.message || error)}`);
          console.log('Si persiste, reinicia y usa modo qr.');
          codeDelivered = false;
        } finally {
          codeRequestRunning = false;
        }
      }

      if (connection === 'open') {
        reconnectAttempts = 0;
        console.log('Bot conectado correctamente.');
        writeConnectedState({
          connected: true,
          connectedAt: Date.now(),
          mode: pairingMode,
          botNumber: normalizeNumber(settings.botNumber || ''),
        });
        return;
      }

      if (connection === 'connecting' && !sock.authState.creds.registered && pairingMode === 'qr') {
        console.log('Esperando escaneo QR desde WhatsApp...');
      }

      if (connection === 'close') {
        const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode || 0;

        if (statusCode === 401 && !sock.authState?.creds?.registered) {
          console.log('Detecte 401 antes de vincular. Limpio auth y reintento automaticamente...');
          clearAuthFolder(authFolder);
        }

        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) scheduleReconnect();
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (localToken !== sessionToken) return;
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
  } catch (err) {
    console.error('Error iniciando bot:', err);
    scheduleReconnect();
  } finally {
    startupRunning = false;
  }
}

startBot().catch((err) => console.error('Error fatal:', err));
