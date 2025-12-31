FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY server.js .
COPY static/ ./static/

RUN mkdir ./data

EXPOSE 3000

CMD ["node", "server.js"]
