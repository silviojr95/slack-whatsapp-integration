require('dotenv').config();
const { chromium } = require('playwright');
const WA = require('@wppconnect/wa-js');
const { sendToSlack } = require('./slack');
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

  await page.exposeFunction('sendToSlack', sendToSlack);

  await page.evaluate(() => {
    WPP.chat.on('chat.new_message', async msg => {
      if (msg.chatId === process.env.GRUPO_ID_WHATSAPP) {
        await window.sendToSlack(`📲 WhatsApp: ${msg.content}`);
      }
    });
  });

  await page.evaluate((to, msg) => {
    return WPP.chat.sendTextMessage(to, msg);
  }, process.env.GRUPO_ID_WHATSAPP, '📣 Bot conectado com Slack via WA-JS!');

  log.info('✅ Integração WhatsApp ↔ Slack rodando com sucesso!');
})();
