#!/bin/sh

# To be run only when wanting to develop the container out

PARENT_DIR=$(dirname $(pwd))

echo '\nNote: You may wish to run "yarn monitor" here\n'

docker run \
    -v ${PARENT_DIR}:/app \
    -p 8080:8080 \
    --cap-add=SYS_ADMIN \
    --rm \
    --user=root \
    -ti zenosmosis/docker-chromium-simple-proxy \
    bash