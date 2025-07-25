const WA = require('@wppconnect/wa-js');
const { fetch } = require('undici');
const log = require('./utils/logger');
require('dotenv').config();

module.exports = function initWhatsApp() {
  WA.webpack.onReady(async () => {
    log.info('✅ WA-JS carregado e pronto!');

    // Envia mensagem inicial ao grupo (se estiver logado)
    if (WA.conn.isAuthenticated()) {
      try {
        await WA.chat.sendTextMessage(
          process.env.GRUPO_ID_WHATSAPP,
          '📣 Bot conectado via @wppconnect/wa-js'
        );
        log.info(`📤 Mensagem enviada ao grupo`);
      } catch (err) {
        log.error('❌ Erro ao enviar mensagem inicial:', err);
      }
    } else {
      log.warn('⚠️ Usuário ainda não está autenticado no WhatsApp Web.');
    }

    // Escuta mensagens novas no grupo
    WA.chat.on('chat.new_message', async msg => {
      const isFromGrupo =
        msg.chatId === process.env.GRUPO_ID_WHATSAPP ||
        msg.sender?.user === process.env.GRUPO_ID_WHATSAPP;

      if (!isFromGrupo || msg.content.includes('💬 Slack')) return;

      log.info(`📥 WhatsApp recebeu: ${msg.content}`);

      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `📲 WhatsApp: ${msg.content}` })
        });
        log.info('📤 Mensagem enviada pro Slack');
      } catch (err) {
        log.error('❌ Erro ao enviar pro Slack:', err);
      }
    });
  });
};
