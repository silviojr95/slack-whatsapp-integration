require('dotenv').config();
const { App } = require('@slack/bolt');
const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const qrcode = require('qrcode-terminal');
const fetch = require('node-fetch');
const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Bot rodando!'));

app.post('/slack/events', express.json(), (req, res) => {
  if (req.body.type === 'url_verification') {
    return res.status(200).send(req.body.challenge);
  }
  // Aqui você trata os eventos reais
});

app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log(`🚀 App escutando na porta ${process.env.PORT}`);
});


let isWhatsAppReady = false;

// 🔗 Conecta ao MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Conectado ao MongoDB');

    const store = new MongoStore({ mongoose });

// 🤖 Inicializa o WhatsApp com RemoteAuth
const client = new Client({
    puppeteer: {
    args: ['--no-sandbox'],
    headless: true
    },
    authStrategy: new RemoteAuth({
    store,
    backupSyncIntervalMs: 60000
    })
});

// 🧠 Confirma que a sessão foi salva
client.on('remote_session_saved', () => {
    console.log('💾 Sessão registrada no MongoDB com sucesso!');
});

// 📱 QR Code para login
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('📱 Escaneie o QR Code com seu WhatsApp');
});

client.on('authenticated', () => {
    console.log('🔐 Autenticado com sucesso!');
});

client.on('auth_failure', msg => {
    console.error('❌ Falha na autenticação:', msg);
});

client.on('ready', async () => {
    isWhatsAppReady = true;
    console.log('✅ WhatsApp está conectado e pronto!');

    // Envia mensagem ao grupo do WhatsApp
    try {
    const chat = await client.getChatById(process.env.GRUPO_ID_WHATSAPP);
    await chat.sendMessage('📣 Bot conectado com RemoteAuth via MongoDB!');
    console.log(`📤 Mensagem enviada ao grupo: ${chat.name}`);
    } catch (err) {
    console.error('❌ Erro ao enviar mensagem inicial:', err);
    }
});

// Integração WhatsApp → Slack
client.on('message_create', async msg => {
    if (msg.fromMe && msg.body.includes('💬 Slack')) return;

    if (
    msg.to === process.env.GRUPO_ID_WHATSAPP ||
    msg.from === process.env.GRUPO_ID_WHATSAPP
    ) {
    console.log(`📥 WhatsApp recebeu: ${msg.body}`);

    try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `📲 WhatsApp: ${msg.body}` })
        });
        console.log('📤 Mensagem enviada pro Slack');
    } catch (err) {
        console.error('❌ Erro ao enviar pro Slack:', err);
    }
    }
});

// Integração Slack → WhatsApp
const slackApp = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN
});

slackApp.event('message', async ({ event }) => {
    console.log('📡 Evento recebido do Slack:', event);
});

slackApp.message(async ({ message }) => {
    if (message.subtype === 'bot_message' || message.bot_id) return;
    if (!isWhatsAppReady) {
    console.error('❌ WhatsApp ainda não está pronto');
    return;
    }

    try {
    if (message.channel === process.env.SLACK_CHANNEL_ID && message.text) {
        const chats = await client.getChats();
        const grupo = chats.find(chat =>
        chat.isGroup && chat.id._serialized === process.env.GRUPO_ID_WHATSAPP
        );

        if (grupo) {
        await grupo.sendMessage(`💬 Slack: ${message.text}`);
        console.log('📤 Slack → WhatsApp: Mensagem enviada!');
        } else {
        console.error('❌ Grupo WhatsApp não encontrado');
        }
    }
    } catch (err) {
    console.error('❌ Erro ao enviar mensagem do Slack para WhatsApp:', err);
    }
});

// 🚀 Inicializa Slack e WhatsApp
(async () => {
    await slackApp.start(process.env.PORT || 3000);
    console.log('⚡ Slack bot rodando');
    client.initialize();
})();
})
.catch(err => {
console.error('❌ Erro ao conectar ao MongoDB:', err);
});
