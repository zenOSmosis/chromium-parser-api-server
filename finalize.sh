# This script performs the finalization process of the installation procedure.

#!/bin/bash

. ./docker-check.sh

if [ ${IS_IN_DOCKER_CONTAINER} == 1 ]; then
    yarn install
    yarn link puppeteer
    cd /app/node_modules/article-date-extractor && python setup.py install
    cd /app  && yarn compile
else
    echo "You must be running inside of the Docker container in order to perform this operation."
fi
