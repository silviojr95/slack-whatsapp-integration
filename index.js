require('dotenv').config();
const { App } = require('@slack/bolt');
const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const qrcode = require('qrcode-terminal');
const fetch = require('node-fetch');

let isWhatsAppReady = false;

// 🚀 Inicializa o Slack App
const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// 🌐 Conecta ao MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  const store = new MongoStore({ mongoose });

  // 🤖 Inicializa o WhatsApp client com RemoteAuth
  const client = new Client({
    puppeteer: {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    },
    authStrategy: new RemoteAuth({
      store,
      backupSyncIntervalMs: 60000
    })
  });

  // 📱 QR Code para login
  client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('📱 Escaneie o QR Code com seu WhatsApp');
  });

  // 🔐 Autenticado
  client.on('authenticated', () => {
    console.log('🔐 Autenticado com sucesso!');
  });

  // ❌ Falha na autenticação
  client.on('auth_failure', msg => {
    console.error('❌ Falha na autenticação:', msg);
  });

  // ✅ WhatsApp pronto
  client.on('ready', async () => {
    isWhatsAppReady = true;
    console.log('✅ WhatsApp está conectado!');

    try {
      const chat = await client.getChatById(process.env.GRUPO_ID_WHATSAPP);
      await chat.sendMessage('📣 Bot conectado ao Slack e ao WhatsApp com sucesso!');
      console.log(`📤 Mensagem enviada ao grupo: ${chat.name}`);
    } catch (err) {
      console.error('❌ Erro ao enviar mensagem de boas-vindas ao grupo:', err);
    }
  });

  // 📥 WhatsApp → Slack
  client.on('message_create', async msg => {
    if (msg.fromMe && msg.body.includes('💬 Slack')) return;

    if (msg.to === process.env.GRUPO_ID_WHATSAPP || msg.from === process.env.GRUPO_ID_WHATSAPP) {
      console.log(`📥 WhatsApp recebeu: ${msg.body}`);

      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `📲 WhatsApp: ${msg.body}` })
        });
        console.log('📤 Enviado ao Slack!');
      } catch (err) {
        console.error('❌ Falha ao enviar pro Slack:', err);
      }
    }
  });

  // 🎧 Slack → WhatsApp
  slackApp.message(async ({ message }) => {
    if (message.subtype === 'bot_message' || message.bot_id) return;
    if (!isWhatsAppReady) {
      console.error('❌ WhatsApp não está pronto');
      return;
    }

    try {
      if (message.channel === process.env.SLACK_CHANNEL_ID && message.text) {
        const chats = await client.getChats();
        const grupo = chats.find(chat => chat.isGroup && chat.id._serialized === process.env.GRUPO_ID_WHATSAPP);

        if (grupo) {
          await grupo.sendMessage(`💬 Slack: ${message.text}`);
          console.log('📤 Slack → WhatsApp: Mensagem enviada!');
        } else {
          console.error('❌ Grupo WhatsApp não encontrado');
        }
      }
    } catch (err) {
      console.error('❌ Erro ao enviar do Slack para WhatsApp:', err);
    }
  });

  // ⚡ Inicializa Slack
  (async () => {
    await slackApp.start(process.env.PORT || 3000);
    console.log('⚡ Slack bot rodando');
    client.initialize();
  })();
});
