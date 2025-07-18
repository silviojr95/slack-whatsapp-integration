# 🤖 Slack ↔ WhatsApp Bridge Bot

Este projeto é um bot em Node.js que conecta grupos do WhatsApp ao Slack (e vice-versa), permitindo integração bidirecional de mensagens entre as duas plataformas.

---

## 🚀 Funcionalidades

- Envia mensagens recebidas no grupo WhatsApp para o Slack via Webhook
- Envia mensagens do Slack para o grupo WhatsApp em tempo real
- Escaneia QR code para autenticação via `whatsapp-web.js`
- Filtra mensagens automáticas e evita loops entre as plataformas
- Permite escutar mensagens criadas pelo próprio usuário no WhatsApp

---

## ⚙️ Tecnologias utilizadas

- [Node.js](https://nodejs.org/)
- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- [@slack/bolt](https://slack.dev/bolt-js)
- [Render](https://render.com/) (para hospedagem na nuvem)
- [dotenv](https://www.npmjs.com/package/dotenv)

---

## 📦 Instalação local

```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio
npm install
```

Crie um arquivo .env com o seguinte conteúdo:
```bash
SLACK_BOT_TOKEN=seu_token_bot
SLACK_SIGNING_SECRET=seu_secret
SLACK_WEBHOOK_URL=seu_webhook
SLACK_CHANNEL_ID=ID_do_canal
GRUPO_ID_WHATSAPP=ID_do_grupo
PORT=3000
```

Você pode descobrir o ID do grupo com base no nome usando o código presente em index.js

## 🧪 Testes locais
```bash
node index.js
```
1. Escaneie o QR Code com o WhatsApp
2. Envie mensagens no grupo e veja elas chegando no Slack
3. Envie mensagens no Slack e veja elas chegando no grupo

## ☁️ Deploy com Render
1. Crie uma conta em Render
2. Suba seu repositório no GitHub
3. Crie um novo Web Service
4. Configure:
   Start command: node index.js
   Environment: Node
   Variáveis de ambiente: copie as do .env
5. Acesse os logs em tempo real e escaneie o QR code

## 📥 Sugestões futuras
- Dividir código em módulos: slack.js, whatsapp.js, logger.js
- Suporte a múltiplos grupos e múltiplos canais
- Painel de controle com interface web

Projeto criado e mantido por [Silvio Júnior](https://github.com/silviojr95/)
