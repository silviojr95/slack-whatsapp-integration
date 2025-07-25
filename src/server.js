require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const initSlack = require('./slack');
const initWhatsApp = require('./whatsapp');
const log = require('./utils/logger');

const app = express();

app.get('/', (req, res) => res.send('Bot rodando!'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    log.info('✅ MongoDB conectado');
    initWhatsApp();
    initSlack();
    app.listen(process.env.PORT || 3000, () => {
      log.info(`🚀 Express escutando na porta ${process.env.PORT || 3000}`);
    });
  })
  .catch(err => {
    log.error('❌ Erro ao conectar ao MongoDB:', err);
  });
