#!/bin/bash
set -e

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

ENABLE_PUBLISH=false
ENABLE_DOCKER=false
ENABLE_REBUILD=false

for i in "$@"
do
  case $i in
    -d|--docker)
      ENABLE_DOCKER=true
    ;;
    -r|--rebuild)
      ENABLE_REBUILD=true
    ;;
    -p|--publish)
      ENABLE_PUBLISH=true
    ;;
    *)
    ;;
  esac
done

cd "$ROOT_DIR/common"
if [ "$ENABLE_REBUILD" = true ]; then
  rm -r -f node_modules build
  npm install
fi
npm run build
if [ "$ENABLE_PUBLISH" = true ]; then
  npm publish
fi

cd "$ROOT_DIR/apptool"
if [ "$ENABLE_REBUILD" = true ]; then
  rm -r -f node_modules build
  npm install
fi
npm run build
if [ "$ENABLE_PUBLISH" = true ]; then
  npm publish
fi

cd "$ROOT_DIR/middleware"
if [ "$ENABLE_REBUILD" = true ]; then
  rm -r -f node_modules build
  mkdir node_modules
  ln -s ../../common node_modules/ghostwriter-common
  npm install
fi
npm run build
if [ "$ENABLE_PUBLISH" = true ]; then
  npm publish
fi

cd "$ROOT_DIR/service"
if [ "$ENABLE_REBUILD" = true ]; then
  rm -r -f node_modules build
  mkdir node_modules
  ln -s ../../common node_modules/ghostwriter-common
  npm install
fi
npm run build
if [ "$ENABLE_PUBLISH" = true ]; then
  npm publish
fi

if [ "$ENABLE_DOCKER" = true ]; then
  cd "$ROOT_DIR"
  if [ "$ENABLE_REBUILD" = true ]; then
    docker build -f service/Dockerfile -t quay.io/process_team/ghostwriter-service:latest --no-cache ./
  else
    docker build -f service/Dockerfile -t quay.io/process_team/ghostwriter-service:latest ./
  fi
  if [ "$ENABLE_PUBLISH" = true ]; then
    docker push quay.io/process_team/ghostwriter-service:latest
  fi
fi

cd "$ROOT_DIR"
echo "Done!"
