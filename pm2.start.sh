#!/bin/bash

. ./docker-check.sh

if [ ${IS_IN_DOCKER_CONTAINER} == 1 ]; then
    pm2 start pm2.config.js "$@"
else
    echo "You must be running inside of the Docker container in order to perform this operation."
fi
