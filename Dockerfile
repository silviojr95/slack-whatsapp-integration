# 🌱 Imagem base leve com Node.js
FROM node:20-alpine

# 📁 Diretório de trabalho
WORKDIR /app

# 📦 Instala dependências do sistema para Chromium
RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont

# 📋 Define caminho do Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 📥 Copia dependências do projeto
COPY package*.json ./
RUN npm install --production

# 📂 Copia o restante do projeto
COPY . .

# 🌐 Expõe a porta dinâmica usada pelo Slack
EXPOSE 3000

# 🚀 Inicia o bot com porta dinâmica
CMD ["node", "index.js"]
