# Chromium Parser API Server

A Dockerized web parser, utilizing Google [Chromium](https://github.com/chromium/chromium) browser (via [Puppeteer](https://github.com/GoogleChrome/puppeteer)) and parts of Mozilla's [Firefox](https://www.mozilla.org/firefox), which serves a RESTful API with a JSON interface.

Note, this package installs Chromium in the container itself and neither Chromium or Firefox need to be installed on the host system.

## Features
- **Stealth Mode**:  Traffic from this engine mimic real-world devices in order help fool automation detection algorithms.  The headless Chromium instance has been modified so it doesn't send headers which expose it is running as a headless instance, and it also randomly mimics different real-world device user agents, client width/heights, and scale factors, to make traffic appear like it is coming from real users.
- **Readability Engine**: Pages are parsed using Mozilla's [Readability](https://github.com/mozilla/readability) engine, to grab the most important source material, without the ads.
- **Metadata Parsing Engine**: Metadata, such as author, image preview, etc. are provided using Mozilla's  [Page Metatag Parser](https://github.com/mozilla/page-metadata-parser) library.
- **Published Date Extraction**: Included algorithm is 90% accurate at identifying article published dates.
- **Open Graph Coorelation**: Relation of pages to Facebook's [Open Graph Protocol](http://ogp.me).
- **Zero Session Persistence**: Cookies and session data are discarded on every page open (written to /dev/null).
- **RESTful API**: Data output via a simple JSON data string, using gzip compression for minimal latency.
- **Documented and Tested**

## API Usage Example

From your web browser, navigate to the following URL:

```
http://localhost:8080?url=https://example.com&jsEnabled=0
```

### Example Output

```
HTTP/1.1 200 OK
   {
       "url": "http://example.com",
       "proxyHTTPStatusCode": 200,
       "fullHTML": "<div>...</div>",
       "fullText": "Logo | Navigation | Hello world! Here's an ad for you!",
       "condensedHTML": "<div>...</div>",
       "condensedText": "Hello world!",
       "author": "John Doe",
       "title": "My webpage",
       "iconURL": "http://example.com/favicon.ico",
       "previewImageURL": "http://example.com/preview-1024x683.jpg",
       "provider": "Example Website",
       "description": "A great website",
       "keywords": "great, fun, website",
       "publishedDate": "2013-08-12 08:51:00",
       "openGraphType": "website",
       "userAgent": "Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%s Mobile Safari/537.36",
       "clientWidth": 412,
       "clientHeight": 732,
       "deviceScaleFactor": 3.5
   }
    
```

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

Things you need to install the software.

- (preferably) A Unix-like host environment (e.g. **Mac** or **Linux**)
- **Docker** 18+ (Note, it MAY work on a lower version of Docker, but hasn't been tested)
- (optional) **Docker Compose** 3.1+

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

This will mount the host's source code into the container's /app directory, give you root privileges to the container, and open a bash prompt at /app.

API in this example utilizes port 8080 on the host.

Note, ensure you're in the project's root directory before executing this command.

```
docker run -v $(pwd):/app -p 8080:8080 -e "IS_PRODUCTION=0" --cap-add=SYS_ADMIN --rm --user=root -ti zenosmosis/chromium-parser-api-server bash
```

Note, unless otherwise specified, all future shell commands in this section refer to being inside of the container itself.

#### Enabling "Monitor Mode"

This command watches the project for changes and automatically performs code linting and compilation on updated changes, generates new documentation for the source code and the API, and launches the API server.

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

## Motivation

We needed to build a tool in order to effectively lift information from web pages, in a rapid fashion, having it completely controlled via an API, with the ability to categorize web content.  It is not intended to "steal" information from the pages, themselves, instead it's intended to be utilized to provide supplemental information on top of search results from other projects.

We feel that websites and content authors should not try to "hide" from such a system; they should, in fact, welcome it to look at their content, in order to help search users make informed decisions on whether to proceed to view the original content on the original website, or not.

This project originally began as a PhantomJS controller, however, being that PhantomJS is no longer being maintained we felt the reason to move on to another system.

The next course of action taken was to try to utilize Firefox or Chrome via a Selenium / WebDriver appproach, but it seemed too limiting for our needs (e.g. no ability to view received headers), slow, and unstable (e.g. running multiple requests in parallel, on a single system, would often crash the system or result in failed responses).

We finally settled on a Google project, Puppeteer, which controls their open-source web browser, Chromium, in a headless fashion.

Being that this project exposes a simple controller interface via a RESTful API, it is easy to integrate into other projects with no special tooling required.

## Acknowledgements

Thanks to the following for their contributions to open-source, which helped make this project a reality.

- [Docker](https://www.docker.com)
- [Debian](https://www.debian.org)
- [Python](https://www.python.org)
- [Node.js](https://nodejs.org)
- Google (for [Chromium](https://github.com/chromium/chromium) & [Puppeteer](https://github.com/GoogleChrome/puppeteer))
- Mozilla (for [Readability](https://github.com/mozilla/readability) and [Page Metatag Parser](https://github.com/mozilla/page-metadata-parser))
- Webhose.io (for the [article date extractor](https://github.com/Webhose/article-date-extractor))
- Microsoft (for [TypeScript](https://www.typescriptlang.org))
- [TypeDoc](http://typedoc.org)
- [APIDOC](http://apidocjs.com)
- [PM2](http://pm2.keymetrics.io) 
- Facebook (for [Jest](https://facebook.github.io/jest/) and [Yarn](https://yarnpkg.com))
