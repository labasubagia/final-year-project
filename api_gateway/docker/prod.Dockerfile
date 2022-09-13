FROM node:alpine

RUN npm install pm2 -g

WORKDIR /app

COPY package.json .
COPY . .

RUN npm install

CMD ["pm2-runtime", "index.js"]
