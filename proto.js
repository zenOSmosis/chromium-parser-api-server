const puppeteer = require('puppeteer');

const IS_JAVASCRIPT_ENABLED = true;
const LOAD_URL = 'https://zenosmosis.com';

(async () => {
    // @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerdefaultargs
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
        ignoreHTTPSErrors: true, // Whether to ignore HTTPS errors during navigation. Defaults to false.
        headless: true, // Whether to run browser in headless mode. Defaults to true unless the devtools option is true.
        timeout: 10000, // Maximum time in milliseconds to wait for the browser instance to start. Defaults to 30000 (30 seconds). Pass 0 to disable timeout.
        dumpio: false, // Whether to pipe the browser process stdout and stderr into process.stdout and process.stderr. Defaults to false.
        userDataDir: '/tmp', // <string> Path to a User Data Directory.
        env: process.env, // Specify environment variables that will be visible to the browser. Defaults to process.env.
        devtools: false, // Whether to auto-open a DevTools panel for each tab. If this option is true, the headless option will be set false.
        pipe: true // Connects to the browser over a pipe instead of a WebSocket. Defaults to false.
    }).then(async (browser) => {
        let page;

        try {
            page = await browser.newPage();
        } catch (err) {
            console.error('Page open error', err);

            browser.close();
            return;
        }

        page.setJavaScriptEnabled(IS_JAVASCRIPT_ENABLED);
    
        // Bind page events
        page.once('load', () => {
            console.log('Page loaded!')
        });
        page.on('request', (request) => {
            console.log({
                url: request.url(),
                headers: request.headers()
            });

            console.log('\n');
        });
        page.once('close', () => {
            console.log('Page closed!')
        });
        
        try {
            await page.goto(LOAD_URL);
        } catch (err) {
            console.error('Navigation error occurred', err);

            browser.close();
            return;
        }

        let evaluationData;

        try {
            // Get the "viewport" of the page, as reported by the page.
            evaluationData = await page.evaluate(() => {
                return {
                    width: document.documentElement.clientWidth,
                    height: document.documentElement.clientHeight,
                    deviceScaleFactor: window.devicePixelRatio,
                    html: document.documentElement.outerHTML
                };
            });
        } catch (err) {
            console.error('Page evaluation error occurred', err);

            browser.close();
            return;
        }

        console.log('Data:', evaluationData);

        await browser.close();

    }).catch((err) => {
        console.error(err);
    });
})();
