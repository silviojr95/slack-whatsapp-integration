FROM mcr.microsoft.com/playwright:v1.54.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "start"]
