FROM node:18-slim

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

RUN mkdir -p uploads

CMD ["npm", "start"]
