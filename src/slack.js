require('dotenv').config();
const { App } = require('@slack/bolt');
const log = require('./utils/logger');

let sendToWhatsApp = null;

function initSlack(sendFn) {
  sendToWhatsApp = sendFn;

  const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true
  });

  app.message(async ({ message, say }) => {
    if (message.channel !== process.env.SLACK_CHANNEL_ID) return;
    if (message.subtype === 'bot_message') return;

    const text = message.text;
    log.info(`📥 Slack recebeu: ${text}`);

    if (sendToWhatsApp) {
      await sendToWhatsApp(text);
      log.info('📤 Slack → WhatsApp enviado');
    }
  });

  app.start().then(() => {
    log.info('🚀 Slack bot conectado via Socket Mode');
  });
}

module.exports = { initSlack };
