#!/bin/bash

# To be run only when wanting to develop the container out

#!/bin/sh

. $(pwd)/../docker-check.sh

if [ ${IS_IN_DOCKER_CONTAINER} == 1 ]; then
    echo "You must not be running inside of the Docker container in order to perform this operation."
else
    PARENT_DIR=$(dirname $(pwd))

    echo '\nNote: You may wish to run "yarn monitor" here\n'

    docker run \
        -v ${PARENT_DIR}:/app \
        -p 8080:8080 \
        --cap-add=SYS_ADMIN \
        --rm \
        --user=root \
        -ti zenosmosis/chromium-parser-api-server \
        bash  
fi