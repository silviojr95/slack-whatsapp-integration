# 🔧 Imagem base Node.js
FROM node:20-alpine

# 📁 Diretório de trabalho
WORKDIR /app

# 🧬 Copia arquivos do projeto
COPY package*.json ./
COPY . .

# 📦 Instala dependências
RUN npm install --production

# 🌐 Expõe a porta (Render usa process.env.PORT)
EXPOSE 3000

# 🚀 Comando para iniciar o bot
CMD ["node", "index.js"]
