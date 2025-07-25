require('dotenv').config();
const { chromium } = require('playwright');
const WA = require('@wppconnect/wa-js');
const { initSlack } = require('./slack');
const log = require('./utils/logger');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://web.whatsapp.com');
  await page.addScriptTag({ path: require.resolve('@wppconnect/wa-js') });
  await page.waitForFunction(() => window.WPP?.isReady);

  const isAuth = await page.evaluate(() => WPP.conn.isAuthenticated());
  if (!isAuth) {
    log.warn('⚠️ Escaneie o QR Code manualmente!');
    await page.waitForTimeout(60000);
  }

  // Expor função para Slack enviar pro WhatsApp
  const sendToWhatsApp = async text => {
    await page.evaluate((to, msg) => {
      return WPP.chat.sendTextMessage(to, msg);
    }, process.env.GRUPO_ID_WHATSAPP, `💬 Slack: ${text}`);
  };

  // Escutar mensagens do WhatsApp e enviar pro Slack
  await page.exposeFunction('sendToSlack', async text => {
    const { fetch } = require('undici');
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `📲 WhatsApp: ${text}` })
    });
  });

  await page.evaluate(() => {
    WPP.chat.on('chat.new_message', async msg => {
      if (msg.chatId === process.env.GRUPO_ID_WHATSAPP) {
        await window.sendToSlack(msg.content);
      }
    });
  });

  // Mensagem inicial
  await sendToWhatsApp('📣 Bot conectado com Slack via WA-JS!');

  // Inicia Slack com função de envio
  initSlack(sendToWhatsApp);

  log.info('✅ Integração bidirecional WhatsApp ↔ Slack ativa!');
})();
