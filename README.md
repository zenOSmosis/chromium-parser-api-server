# Chromium Parser API Server

A web parser, built on Google's Chromium and Mozilla's Readability engines, this serves a RESTful API with JSON for output.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

Things you need to install the software.

- (preferably) A Unix-like host environment (e.g. Mac or Linux)
- Docker 17+
- (optional) Docker Compose 3.1+

### Building

A step by step series of examples that tell you how to get a deployment or development env running.


#### Without Docker Compose
```
docker build -t zenosmosis/chromium-parser-api-server .
```

#### With Docker Compose
```
docker-compose build
```

### Running

#### Without Docker Compose

```
docker run -p 8080:8080 --cap-add=SYS_ADMIN --rm zenosmosis/chromium-parser-api-server
```

#### With Docker Compose

```
docker-compose up
```

## Development

This project is mostly based in TypeScript, and uses Node.js with Express to serve the API.


#### Launching Development API Server

This will mount the host's source code into the container's /app directory, give you root privilges to the container, and open a bash prompt at /app.

API in this example utilizes port 8080 on the host.

Note, ensure you're in the project's root directory before executing this command.

```
docker run -v $(pwd):/app -p 8080:8080 -e "env=development" --cap-add=SYS_ADMIN --rm --user=root -ti zenosmosis/chromium-parser-api-server bash
```

Note, unless otherwise specified, all future shell commands in this section refer to being inside of the container itself.

#### Enabling "Monitor Mode"

This command watches the project for changes and automatically lints and compiles it on updated changes, automatically generates new documentation for the source code and the API, and launches the API server.

```
yarn monitor
```

#### Compiling

Compiled JavaScript is sent to /build.

```
yarn compile
```

#### Running Tests

```
yarn test
```

#### Generating Documentation

##### Source Code Documentation
```
yarn gen:docs:source
```

##### API Documentation
```
yarn gen:docs:api
```

#### Viewing Documentation
First, we need to spin up the API server, if it's not already running.

```
yarn monitor
```

View the documentation in a web browser.

##### Source Documentation

```
http://localhost:8080/docs/source
```

##### API Documentation

```
http://localhost:8080/docs/api
```


## Usage Example

From your web browser, navigate to the following URL:

```
http://localhost:8080?url=https://zenosmosis.com&jsEnabled=false
```

Note: So far this has been tested to work w/ Ubuntu 16.04 running Docker 18.03.1-ce 

## Debugging Notes

- if you got page crash with `BUS_ADRERR` ([chromium issue](https://bugs.chromium.org/p/chromium/issues/detail?id=571394)), increase shm-size on docker run with `--shm-size` argument

```bash
docker run --shm-size 1G --rm zenosmosis/chromium-parser-api-server
```

- If you're seeing random navigation errors (unreachable url) it's likely due to ipv6 being enabled in docker. Navigation errors are caused by ERR_NETWORK_CHANGED (-21) in chromium. Disable ipv6 in your container using `--sysctl net.ipv6.conf.all.disable_ipv6=1` to fix:
```bash
docker run --shm-size 1G --sysctl net.ipv6.conf.all.disable_ipv6=1 --rm zenosmosis/chromium-parser-api-server
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