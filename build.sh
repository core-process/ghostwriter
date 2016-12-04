#!/bin/bash
set -e

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$ROOT_DIR/common"
npm run build
npm publish

cd "$ROOT_DIR/apptool"
npm run build
npm publish

cd "$ROOT_DIR/middleware"
npm run build
npm publish

cd "$ROOT_DIR/service"
npm run build
npm publish
./build-image.sh

cd "$ROOT_DIR"
echo "Done!"
