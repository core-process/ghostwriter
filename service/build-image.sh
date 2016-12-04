#!/bin/bash
set -e

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

docker build -t quay.io/process_team/ghostwriter-service:latest ./

if [ "$ENABLE_PUBLISH" = true ]; then
  docker push quay.io/process_team/ghostwriter-service:latest
fi
