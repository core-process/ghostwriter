FROM node:6

RUN mkdir -p /app
WORKDIR /app

# add your application critical run time files
# don't add your .git folder ;)
COPY ./src               /app/src
COPY ./.babelrc          /app/.babelrc
COPY ./package.json      /app/package.json

# install dependencies and build software
RUN npm install
RUN npm run build

# cleanup sourcecode
RUN rm -r -f /app/src

# start your application
CMD [ "npm", "start", "--", \
  "--port", "8888", \
  "--database-uri", "mongodb://database:27017/ghostwriter" \
]

# expose the port the application listens on, used later in
# the docker-compose file
EXPOSE 8888
