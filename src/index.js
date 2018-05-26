const express = require('express');
const app = express();
const { Puppeteer } = require('./Puppeteer');

const APP_LISTEN_PORT = 8080;

app.get('/', (req, res) => {
    var url;

    if (!(url = req.query.url)) {
        // const nodeUptime = parseFloat((getTime() - startTime) / 1000) + ' seconds';

        res.send('Ready');
    } else {
        var puppeteer = new Puppeteer(url),
            isPassedToContentParser;

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

app.listen(APP_LISTEN_PORT);