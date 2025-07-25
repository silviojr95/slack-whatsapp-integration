# Node base LTS
FROM node:20-alpine

# Diretório de trabalho
WORKDIR /app

# Dependências
COPY package*.json ./
RUN npm install

# Cópia dos arquivos
COPY . .

# Porta
EXPOSE 3000

# Start
CMD ["node", "src/server.js"]
