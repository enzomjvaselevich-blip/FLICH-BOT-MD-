require('dotenv').config();

const pino = require('pino');
const readline = require('readline');
const { Boom } = require('@hapi/boom');
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
  } = require('@whiskeysockets/baileys'));
} catch {
  console.log('Instala Baileys para ejecutar el bot: npm i @whiskeysockets/baileys');
  process.exit(0);
}

const { reloadCommands } = require('./utils/reloadCommands');

const PREFIX = process.env.BOT_PREFIX || '.';
const OWNER_NUMBER = String(process.env.OWNER_NUMBER || '').replace(/\D/g, '');
const BOT_NUMBER = String(process.env.BOT_NUMBER || '').replace(/\D/g, '');
const AUTH_FOLDER = process.env.AUTH_FOLDER || 'auth_info_baileys';

function normalizeNumber(value = '') {
  return String(value || '').split('@')[0].split(':')[0].replace(/\D/g, '');
}

function getMessageText(msg = {}) {
  const m = msg.message || {};
  return m.conversation || m.extendedTextMessage?.text || '';
}

function askQuestion(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close();
    resolve(answer);
  }));
}

async function getPairingTargetNumber() {
  if (BOT_NUMBER) return BOT_NUMBER;
  const input = await askQuestion('Numero para vincular (ej: 51912345678): ');
  const parsed = String(input || '').replace(/\D/g, '');
  if (!parsed) throw new Error('Numero invalido.');
  return parsed;
}

function isOwner(jid = '') {
  return normalizeNumber(jid) === OWNER_NUMBER;
}

async function startBot() {
  reloadCommands();

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    auth: state,
    browser: ['HIYUKI BOT', 'Chrome', '1.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      console.log('Bot conectado.');
      return;
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) setTimeout(() => startBot().catch(console.error), 2000);
      return;
    }
  });

  if (!sock.authState.creds.registered) {
    const number = await getPairingTargetNumber();
    const code = await sock.requestPairingCode(number);
    console.log(`Codigo de vinculacion: ${code}`);
  }

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const m = messages?.[0];
    if (!m || m.key.fromMe) return;

    const body = getMessageText(m).trim();
    if (!body.startsWith(PREFIX)) return;

    const args = body.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = String(args.shift() || '').toLowerCase();
    const cmd = global.comandos?.get(commandName);
    if (!cmd) return;

    const from = m.key.remoteJid;
    const sender = m.key.participant || from;

    if (cmd.isOwner && !isOwner(sender)) {
      await sock.sendMessage(from, { text: 'Solo el owner puede usar este comando.' }, { quoted: m });
      return;
    }

    await cmd.run(sock, m, args, from, isOwner(sender));
  });
}

startBot().catch((err) => console.error('Error iniciando bot:', err));
