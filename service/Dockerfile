FROM node:7

RUN mkdir -p /app/common && mkdir -p /app/service/node_modules

COPY ./common/src           /app/common/src
COPY ./common/.babelrc      /app/common/.babelrc
COPY ./common/package.json  /app/common/package.json

COPY ./service/src          /app/service/src
COPY ./service/.babelrc     /app/service/.babelrc
COPY ./service/package.json /app/service/package.json

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
