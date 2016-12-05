FROM node:7

RUN mkdir -p /app/common && mkdir -p /app/service/node_modules

WORKDIR /app
COPY common/src           common/src
COPY common/.babelrc      common/.babelrc
COPY common/package.json  common/package.json
COPY service/src          service/src
COPY service/.babelrc     service/.babelrc
COPY service/package.json service/package.json

RUN ln -s /app/common /app/service/node_modules/ghostwriter-common

WORKDIR /app/common
RUN npm install
RUN npm run build

WORKDIR /app/service
RUN npm install
RUN npm run build

RUN rm -r -f /app/common/src
RUN rm -r -f /app/service/src

WORKDIR /app/service
CMD [ "npm", "start", "--", \
  "--port", "8888", \
  "--database-uri", "mongodb://database:27017/ghostwriter" \
]

EXPOSE 8888
