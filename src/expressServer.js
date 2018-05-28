import express from 'express';
const expressServer = express();
import { Puppeteer } from './Puppeteer';
import PuppeteerAPIServer from './PuppeteerAPIServer';
import HTMLParser from './HTMLParser';

// Docs serving
(function(expressServer){
    expressServer.use('/docs/api', express.static('/app/docs/api'));

    expressServer.use('/docs/source', express.static('/app/docs/source'));
})(expressServer);

var apiServer = new PuppeteerAPIServer(expressServer);

export default expressServer;