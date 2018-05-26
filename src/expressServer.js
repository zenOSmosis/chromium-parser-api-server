const express = require('express');
const expressServer = express();
const { Puppeteer } = require('./Puppeteer');

expressServer.get('/', (req, res) => {
    var url;

    if (!(url = req.query.url)) {
        res.send('Ready');
    } else {
        const puppeteer = new Puppeteer(url, {
            isJavaScriptEnabled: true
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
        });

        puppeteer.fetch();
    }
});

exports.expressServer = expressServer;