import express from 'express';
const expressServer = express();
import { Puppeteer } from './Puppeteer';

var _toBoolean = (value) => {
    if (value == 1 || value == true) {
        return true;
    } else {
        return false;
    }
};

var _getIsJavaScriptEnabled = (query) => {
    const defaultValue = true;

    if (typeof query['jsEnabled'] === 'undefined') {
        query['jsEnabled'] = defaultValue;
    }

    // Convert to boolean
    query['jsEnabled'] = _toBoolean(query['jsEnabled']);

    return query['jsEnabled'];
};

expressServer.get('/', (req, res) => {
    var url;

    if (!(url = req.query.url)) {
        res.send('Ready');
    } else {
        const puppeteer = new Puppeteer(url, {
            isJavaScriptEnabled: _getIsJavaScriptEnabled(req.query)
        });
        
        var isPassedToContentParser;

        // Handle prematurely-ended connections
        req.connection.on('close',function(){
            puppeteer.terminate();

            console.log('Puppeteer is closed');
        });

        // Prevent hung pages
        puppeteer.on('close', () => {
            if (isPassedToContentParser) {
                return;
            }

            if (!res.headersSent) {
                res.send('(Empty response)');
            }
        });

        puppeteer.on('page-source', (html) => {
            // console.log(resp);
            res.send(html);

            puppeteer.terminate();
        });

        puppeteer.fetch();
    }
});

export default expressServer;