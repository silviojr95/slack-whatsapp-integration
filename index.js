require('dotenv').config();
const { App } = require('@slack/bolt');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fetch = require('node-fetch');

let isWhatsAppReady = false;

// 🚀 Inicializa o WhatsApp client
const { RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('whatsapp-web.js-remote-auth');

const client = new Client({
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true
  },
  authStrategy: new RemoteAuth({
    store: new MongoStore({
      mongoURI: process.env.MONGO_URI,
      mongoOptions: {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    }),
    backupSyncIntervalMs: 60000 // opcional, sincroniza sessão a cada 1min
  })
});

// 🟨 QR code para login
client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  console.log('📱 Escaneie o QR Code com seu WhatsApp');
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

// 📥 Recebe mensagens do WhatsApp e envia pro Slack
client.on('message_create', async msg => {
    // Ignora apenas mensagens que vieram do Slack com a marca "💬 Slack"
    if (msg.fromMe && msg.body.includes('💬 Slack')) {
      console.log('🔁 Ignorado: mensagem de retorno do Slack');
      return;
    }
  
    // Processa se for o grupo certo
    if (msg.to === process.env.GRUPO_ID_WHATSAPP || msg.from === process.env.GRUPO_ID_WHATSAPP) {
      console.log(`📥 Mensagem válida no grupo: ${msg.body}`);
      
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `📲 WhatsApp: ${msg.body}` })
        });
        console.log('📤 Enviada ao Slack!');
      } catch (err) {
        console.error('❌ Falha ao enviar pro Slack:', err);
      }
    } else {
      console.log(`🔕 Ignorado: grupo não autorizado (${msg.from})`);
    }
  });

// 🔊 Slack → WhatsApp
const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

slackApp.message(async ({ message }) => {
  console.log(`🎧 Slack escutou: ${message.text}`);
  

  if (message.subtype === 'bot_message' || message.bot_id) {
    console.log('🔁 Ignorado: mensagem enviada por bot no Slack');
    return;
  }

  if (!isWhatsAppReady) {
    console.error('❌ WhatsApp ainda não está pronto');
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

// 🚀 Inicialização geral
(async () => {
  await slackApp.start(process.env.PORT || 3000);
  console.log('⚡ Slack bot rodando');
  client.initialize();
})();

