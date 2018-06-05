# This file is intended solely for PM2 to be able to watch the source tree.

#!/bin/sh

. ./docker-check.sh

if [ ${IS_IN_DOCKER_CONTAINER} == 1 ]; then
    yarn gen:docs:api && \
    yarn gen:docs:source
else
    echo "You must be running inside of the Docker container in order to perform this operation."
fi