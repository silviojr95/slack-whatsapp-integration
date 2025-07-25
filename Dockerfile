# Node base LTS
FROM node:20-alpine

# Diretório de trabalho
WORKDIR /app

# Dependências
COPY package*.json ./
RUN apt-get update && apt-get install -y git
RUN npm install

# Cópia dos arquivos
COPY . .

# Porta
EXPOSE 3000

# Start
CMD ["node", "src/server.js"]
