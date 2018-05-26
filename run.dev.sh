#!/bin/sh

# To be run only when wanting to develop the container out

docker run \
    -v $(pwd):/app \
    -p 8080:8080 \
    -ti puppeteer \
    bash