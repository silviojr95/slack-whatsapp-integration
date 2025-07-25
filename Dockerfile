# Node base LTS
FROM node:20-bullseye

# Diretório de trabalho
WORKDIR /app

# Dependências
COPY package*.json ./
RUN apk update && apk add git
RUN npm install

# Cópia dos arquivos
COPY . .

# Porta
EXPOSE 3000

# Start
CMD ["node", "src/server.js"]
