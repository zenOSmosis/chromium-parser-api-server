// TODO: Implement incognito mode
// TODO: Stop sending x-devtools-emulate-network-conditions-client-id header

import puppeteer from 'puppeteer';
import EventEmitter from 'events';

const DEFAULT_IS_JAVASCRIPT_ENABLED = true;

/**
 * Note: This class interfaces directly with the backend Chrome/Chromium engine.
 */
class Puppeteer {
    constructor(url, options) {
        this._url = url;

        if (typeof options !== 'object') {
            options = {};
        }
        this._options = options;
        this._options.isJavaScriptEnabled = (function(options){
            let isJavaScriptEnabled;

            if (typeof options.isJavaScriptEnabled === 'undefined') {
                isJavaScriptEnabled = DEFAULT_IS_JAVASCRIPT_ENABLED;
            } else {
                // Convert to boolean
                isJavaScriptEnabled = (options.isJavaScriptEnabled ? true : false);
            }

            return isJavaScriptEnabled;
        })(options);

        this._events = new EventEmitter();
        this._browser;
    }

    on(eventName, listener) {
        return this._events.on(eventName, listener);
    }

    fetch() {

        (async (self) => {
            // @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerdefaultargs
            self._browser = await puppeteer.launch({
                // Note: --cap-add=SYS_ADMIN must be enabled for this container to run without a sandbox
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ],
                ignoreHTTPSErrors: true, // Whether to ignore HTTPS errors during navigation. Defaults to false.
                headless: true, // Whether to run browser in headless mode. Defaults to true unless the devtools option is true.
                timeout: 10000, // Maximum time in milliseconds to wait for the browser instance to start. Defaults to 30000 (30 seconds). Pass 0 to disable timeout.
                dumpio: false, // Whether to pipe the browser process stdout and stderr into process.stdout and process.stderr. Defaults to false.
                userDataDir: '/dev/null', // <string> Path to a User Data Directory.
                env: process.env, // Specify environment variables that will be visible to the browser. Defaults to process.env.
                devtools: false, // Whether to auto-open a DevTools panel for each tab. If this option is true, the headless option will be set false.
                pipe: true // Connects to the browser over a pipe instead of a WebSocket. Defaults to false.
            }).then(async (browser) => {
                // Ensure we've got the same object running as a property
                self._browser = browser;
                
                let page;
        
                try {
                    page = await browser.newPage();
                } catch (err) {
                    console.error('Page open error', err);
        
                    self.terminate();
                    return;
                }

                page.setRequestInterception(false);
        
                page.setJavaScriptEnabled(self._options.isJavaScriptEnabled);
                console.log('Set JS enabled value to:', self._options.isJavaScriptEnabled);
            
                // Bind page events
                page.once('load', () => {
                    console.log('Page loaded!')
                });
                page.on('request', (request) => {
                    console.log('REQUEST', {
                        url: request.url(),
                        method: request.method(),
                        headers: request.headers(),
                        postData: request.postData(),
                        resourceType: request.resourceType()
                    });
                });
                page.on('response', (response) => {
                    console.log('RESPONSE', {
                        url: response.url(),
                        isCached: response.fromCache(), // True if the response was served from either the browser's disk cache or memory cache.
                        isFromServiceWorker: response.fromServiceWorker(),
                        headers: response.headers(),
                        isSuccess: response.ok(), // Whether the response was successful (status in the range 200-299) or not.
                        statusCode: response.status()
                    });
                });
                page.once('close', () => {
                    console.log('Page closed!')
                });
                
                try {
                    await page.goto(self._url);
                } catch (err) {
                    console.error('Navigation error occurred', err);
        
                    self.terminate();
                    return;
                }
        
                let evaluationData;
        
                try {
                    // Get the "viewport" of the page, as reported by the page.
                    evaluationData = await page.evaluate(() => {
                        return {
                            // width: document.documentElement.clientWidth,
                            // height: document.documentElement.clientHeight,
                            // deviceScaleFactor: window.devicePixelRatio,
                            pageSource: document.documentElement.outerHTML
                        };
                    });
                } catch (err) {
                    console.error('Page evaluation error occurred', err);
        
                    self.terminate();
                    return;
                }
        
                console.log('Data:', evaluationData);
                this._events.emit('page-source', evaluationData.pageSource);
        
                await self.terminate();
        
            }).catch((err) => {
                console.error(err);
            });
        })(this);
    }

    /**
     * Closes Chromium and all of its pages (if any were opened).
     * The Browser object itself is considered to be disposed and cannot be used anymore.
     */
    terminate() {
        if (!this._browser) {
            console.error('Browser is not set');
            return;
        }

        this._browser.close();
        // TODO: Listen to browser close event instead, if possible
        this._events.emit('close');
    }
}

// exports.Puppeteer = Puppeteer;
export default Puppeteer;