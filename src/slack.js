const { App } = require('@slack/bolt');
const log = require('./utils/logger');

module.exports = function initSlack() {
  const slackApp = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN
  });

  slackApp.message(async ({ message }) => {
    if (message.subtype === 'bot_message' || message.bot_id) return;
    if (!global.WAClient) {
      log.error('❌ WhatsApp ainda não inicializado');
      return;
    }

    try {
      const chats = await global.WAClient.getChats();
      const grupo = chats.find(chat =>
        chat.isGroup && chat.id._serialized === process.env.GRUPO_ID_WHATSAPP
      );

      if (grupo && message.text) {
        await grupo.sendMessage(`💬 Slack: ${message.text}`);
        log.info('📤 Slack → WhatsApp: Mensagem enviada!');
      }
    } catch (err) {
      log.error('❌ Erro ao enviar do Slack para WhatsApp:', err);
    }
  });

  slackApp.start().then(() => {
    log.info('⚡ Slack bot rodando');
  });
};
