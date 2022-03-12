FROM node:12.1.0

RUN mkdir -p /usr/src/ivna
WORKDIR /usr/src/ivna
COPY package*.json /usr/src/ivna
RUN npm install
COPY . /usr/src/ivna

RUN npm install
EXPOSE 8000
ENTRYPOINT ["npm", "start"]