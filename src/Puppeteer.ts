// TODO: Implement incognito mode
// TODO: Stop sending x-devtools-emulate-network-conditions-client-id header

import puppeteer from 'puppeteer';
import EventEmitter from 'events';

interface IPuppeteerOptions {
    isJavaScriptEnabled: boolean;
}

interface IPuppeteerPageRequest {
    url: string;
    method: puppeteer.HttpMethod;
    headers: puppeteer.Headers;
    postData: string | undefined;
    resourceType: string;
}

interface IPuppeteerPageResponse {
    url: string;
    isCached: boolean;
    isFromServiceWorker: boolean;
    headers: puppeteer.Headers;
    isSuccess: boolean;
    statusCode: number;
}

/**
 * Note: This class interfaces directly with the back-end Chrome/Chromium engine.
 */
class Puppeteer {
    // TODO: Implement error events

    /**
     * @event
     * Emits when the underlying page has loaded.
     */
    public static EVT_PAGE_LOAD: string = 'page-load';

    /**
     * @event
     * Emits when the underlying page has cloased.
     */
    public static EVT_PAGE_CLOSE: string = 'page-close';

    /**
     * @event
     * Emits, with an IPuppeteerPageRequest, when the page, or a sub-resource, has been requested.
     */
    public static EVT_PAGE_REQUEST: string = 'page-request';

    /**
     * @event
     * Emits, with an IPuppeteerPageRequest, when a request fails, for example by timing out.
     */
    public static EVT_PAGE_REQUEST_FAIL: string = 'page-request-fail';

    /**
     * @event
     * Emits, with an IPuppeteerPageResponse, when the page, or a sub-resource, has been responded to.
     */
    public static EVT_PAGE_RESPONSE: string = 'page-response';

    /**
     * @event
     * Emits when the engine has closed.
     */
    public static EVT_CLOSE: string = 'close';

    protected _url: string;
    protected _events: EventEmitter;
    protected _options: IPuppeteerOptions = {
        isJavaScriptEnabled: true // Set JavaScript enabled to be true, by default
    };
    protected _browser: any;

    constructor(url: string, options?: IPuppeteerOptions) {
        this._url = url;

        if (typeof options !== 'undefined') {
            this._options = options;
        }

        this._events = new EventEmitter();
    }

    /**
     * Retrieves the engines set to the internal browser engine.
     */
    public getEngineOptions(): {} {
        return {
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
        };
    }

    on(eventName: string, listener: (...args: any[]) => void): void {
        this._events.on(eventName, listener);
    }

    off(eventName: string, listener: (...args: any[]) => void): void {
        this._events.off(eventName, listener);
    }

    /**
     * Fetches the URL.
     */
    fetch(): void {
        (async (self) => {
            // @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerdefaultargs
            self._browser = await puppeteer
                .launch(self.getEngineOptions())
                .then(async (browser) => {
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
                    self._bindPageEvents(page);

                    try {
                        await page.goto(self._url);
                    } catch (err) {
                        console.error('Navigation error occurred', err);

                        self.terminate();
                        return;
                    }

                    let evaluationData;
                    let document: any;

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

                    // console.log('Data:', evaluationData);
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
    terminate(): void {
        if (!this._browser) {
            console.error('Browser is not set');
            return;
        }

        this._browser.close();
        // TODO: Listen to browser close event instead, if possible
        this._events.emit(Puppeteer.EVT_CLOSE);
    }

    /**
     * @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-page
     */
    protected _bindPageEvents(page: puppeteer.Page): void {
        const self = this;

        page.once('load', () => {
            self._events.emit(Puppeteer.EVT_PAGE_LOAD);
        });

        page.on('request', (request: puppeteer.Request) => {
            const pageRequest: IPuppeteerPageRequest = {
                url: request.url(),
                method: request.method(),
                headers: request.headers(),
                postData: request.postData(),
                resourceType: request.resourceType()
            };

            self._events.emit(Puppeteer.EVT_PAGE_REQUEST, pageRequest);
        });

        page.on('requestfailed', (request: puppeteer.Request) => {
            const pageRequest: IPuppeteerPageRequest = {
                url: request.url(),
                method: request.method(),
                headers: request.headers(),
                postData: request.postData(),
                resourceType: request.resourceType()
            };

            self._events.emit(Puppeteer.EVT_PAGE_REQUEST_FAIL, pageRequest);
        });

        page.on('response', (response: puppeteer.Response) => {
            const pageResponse: IPuppeteerPageResponse = {
                url: response.url(),
                isCached: response.fromCache(), // True if the response was served from either the browser's disk cache or memory cache.
                isFromServiceWorker: response.fromServiceWorker(),
                headers: response.headers(),
                isSuccess: response.ok(), // Whether the response was successful (status in the range 200-299) or not.
                statusCode: response.status()
            };

            self._events.emit(Puppeteer.EVT_PAGE_RESPONSE, pageResponse);
        });

        page.once('close', () => {
            console.log('Page closed!');

            self._events.emit(Puppeteer.EVT_PAGE_CLOSE);
        });
    }
}

export {
    Puppeteer,
    IPuppeteerOptions,
    IPuppeteerPageRequest,
    IPuppeteerPageResponse
};