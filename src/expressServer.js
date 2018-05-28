import express from 'express';
const expressServer = express();
import { Puppeteer } from './Puppeteer';
import HTMLParser from './HTMLParser';

import APIServer from './APIServer';

// Docs serving
(function(expressServer){
    expressServer.use('/docs/api', express.static('/app/docs/api'));

    expressServer.use('/docs/source', express.static('/app/docs/source'));
})(expressServer);

var apiServer = new APIServer(expressServer);

export default expressServer;