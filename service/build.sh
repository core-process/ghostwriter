#!/bin/bash
set -e
docker build -t quay.io/process_team/ghostwriter-service:latest ./
docker push quay.io/process_team/ghostwriter-service:latest
