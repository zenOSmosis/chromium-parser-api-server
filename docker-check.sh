# Simple utility to determine if running inside of a Docker container.
#
# Sets environment variable IS_IN_DOCKER_CONTAINER to boolean value, indicating whether
# we are running inside of Docker or not.
#
# @see https://stackoverflow.com/questions/20010199/how-to-determine-if-a-process-runs-inside-lxc-docker

#!/bin/bash

if [ -f /.dockerenv ]; then
    IS_IN_DOCKER_CONTAINER=1
else
    IS_IN_DOCKER_CONTAINER=0
fi