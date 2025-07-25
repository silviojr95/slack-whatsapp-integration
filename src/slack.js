const { fetch } = require('undici');
const log = require('./utils/logger');

async function sendToSlack(text) {
  try {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    log.info('📤 Mensagem enviada pro Slack');
  } catch (err) {
    log.error('❌ Erro ao enviar pro Slack:', err);
  }
}

module.exports = { sendToSlack };
