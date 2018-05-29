# Docker Chromium GET Request Proxy

A simple GET proxy based on Docker, Chromium, [Google Puppeteer](https://github.com/GoogleChrome/puppeteer), Node.js, and Express.

## Building

### Without Docker Compose
```
docker build -t zenosmosis/docker-chromium-simple-proxy .
```

### With Docker Compose
```
docker-compose build
```

## Running

### Without Docker Compose

```
docker run -p 8080:8080 --cap-add=SYS_ADMIN zenosmosis/docker-chromium-simple-proxy
```

### With Docker Compose

```
docker-compose up
```

## Usage Example

From your web browser, navigate to the following URL

```
localhost:8080?url=https://zenosmosis.com&jsEnabled=false
```

Note: So far this has been tested to work w/ Ubuntu 16.04 running Docker 18.03.1-ce 

## Developing
If you wish to launch the container to develop in, while automatically mounting the project directory in the container's /app directory, see /dev.

## Debugging Notes

- if you got page crash with `BUS_ADRERR` ([chromium issue](https://bugs.chromium.org/p/chromium/issues/detail?id=571394)), increase shm-size on docker run with `--shm-size` argument

```bash
docker run --shm-size 1G --rm zenosmosis/docker-chromium-simple-proxy
```

- If you're seeing random navigation errors (unreachable url) it's likely due to ipv6 being enabled in docker. Navigation errors are caused by ERR_NETWORK_CHANGED (-21) in chromium. Disable ipv6 in your container using `--sysctl net.ipv6.conf.all.disable_ipv6=1` to fix:
```bash
docker run --shm-size 1G --sysctl net.ipv6.conf.all.disable_ipv6=1 --rm zenosmosis/docker-chromium-simple-proxy
```

- add `--enable-logging` for chrome debug logging http://www.chromium.org/for-testers/enable-logging

```js
const puppeteer = require('puppeteer');

(async() => {

    const browser = await puppeteer.launch({args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',

        // debug logging
        '--enable-logging', '--v=1'
    ]});

```