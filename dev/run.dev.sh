#!/bin/sh

# To be run only when wanting to develop the container out

PARENT_DIR=$(dirname $(pwd))

echo '\nNote: You may wish to run "./pm2.start.sh" with, or without, the --no-daemon option\n'

docker run \
    -v ${PARENT_DIR}:/app \
    -p 8080:8080 \
    --cap-add=SYS_ADMIN \
    -ti zenosmosis/docker-chromium-simple-proxy \
    bash