const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const qrcode = require('qrcode-terminal');
const { fetch } = require('undici');
const log = require('./utils/logger');
const WA = require('@wppconnect/wa-js');

module.exports = function initWhatsApp() {
  const store = new MongoStore({ mongoose });

  const client = new Client({
    puppeteer: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process'
      ],
      headless: true
    },
    authStrategy: new RemoteAuth({
      store,
      backupSyncIntervalMs: 60000,
      dataPath: './.wwebjs_auth'
    })
  });

  client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    log.info('📱 Escaneie o QR Code com seu WhatsApp');
  });

  client.on('ready', async () => {
    log.info('✅ WhatsApp conectado');

    try {
      const chat = await client.getChatById(process.env.GRUPO_ID_WHATSAPP);
      await chat.sendMessage('📣 Bot conectado via RemoteAuth');
      log.info(`📤 Mensagem enviada ao grupo: ${chat.name}`);
    } catch (err) {
      log.error('❌ Erro ao enviar mensagem inicial:', err);
    }
  });

  client.on('message_create', async msg => {
    if (msg.fromMe && msg.body.includes('💬 Slack')) return;

    if (
      msg.to === process.env.GRUPO_ID_WHATSAPP ||
      msg.from === process.env.GRUPO_ID_WHATSAPP
    ) {
      log.info(`📥 WhatsApp recebeu: ${msg.body}`);

      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `📲 WhatsApp: ${msg.body}` })
        });
        log.info('📤 Mensagem enviada pro Slack');
      } catch (err) {
        log.error('❌ Erro ao enviar pro Slack:', err);
      }
    }
  });

  
  global.WAClient = client;

  WA.webpack.onReady(() => {
    console.log('WA-JS pronto!');
    WA.chat.sendTextMessage('5511999999999@c.us', 'Olá, Silvio!');
  });
  
  client.initialize();
};
