FROM node:12.1.0

RUN mkdir -p /usr/src/ivna
WORKDIR /usr/src/ivna
COPY package*.json /usr/src/ivna/
RUN npm ci
COPY . .


EXPOSE 8000
CMD ["npm", "start"]