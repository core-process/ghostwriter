#!/bin/bash
set -e

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENABLE_PUBLISH=false

for i in "$@"
do
  case $i in
    -p|--publish)
      ENABLE_PUBLISH=true
    ;;
    *)
    ;;
  esac
done

cd "$ROOT_DIR/common"
npm run build
if [ "$ENABLE_PUBLISH" = true ]; then
  npm publish
fi

cd "$ROOT_DIR/apptool"
npm run build
if [ "$ENABLE_PUBLISH" = true ]; then
  npm publish
fi

cd "$ROOT_DIR/middleware"
npm run build
if [ "$ENABLE_PUBLISH" = true ]; then
  npm publish
fi

cd "$ROOT_DIR/service"
npm run build
if [ "$ENABLE_PUBLISH" = true ]; then
  npm publish
  ./build-image.sh --publish
else
  ./build-image.sh
fi

cd "$ROOT_DIR"
echo "Done!"
