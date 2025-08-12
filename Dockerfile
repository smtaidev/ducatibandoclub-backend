FROM node:22.17.0

WORKDIR /usr/src/pma

COPY ./package.json ./

RUN npm install

COPY . .

EXPOSE 8701

CMD ["npm", "start"]