// TODO: Implement incognito mode
// TODO: Stop sending x-devtools-emulate-network-conditions-client-id header

import puppeteer from 'puppeteer';
import EventEmitter from 'events';

/**
 * Abstracted configuration options.
 */
interface IPuppeteerRequestOptions {
    isJavaScriptEnabled: boolean;
}

/**
 * Set of configurable options to set on the browser.
 * @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerdefaultargs
 */
interface IPuppeteerLaunchOptions {
    ignoreHTTPSErrors?: boolean;
    headless?: boolean;
    executablePath?: string;
    slowMo?: number;
    args?: Array<string>;
    ignoreDefaultArgs?: boolean;
    handleSIGINT?: boolean;
    handleSIGTERM?: boolean;
    handleSIGHUP?: boolean;
    timeout?: number;
    dumpio?: boolean;
    userDataDir?: string;
    env?: object;
    devtools?: boolean;
    pipe?: boolean;
}

interface IPuppeteerPageRequest {
    url: string;
    method: puppeteer.HttpMethod;
    headers: puppeteer.Headers;
    postData: string | undefined;
    resourceType: string;
    isToFulfill?: boolean;
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
 * This class interfaces directly with the back-end Chromium engine.
 */
class Puppeteer {
    // TODO: Implement error events

    /**
     * @event
     * Emits, with an Error object, when any type of error has been thrown.
     */
    public static EVT_ERROR: string = 'error';

    /**
     * @event
     * Emits when the underlying page has loaded.
     * 
     * Note!  This runs IMMEDIATELY after the page has loaded.
     * Using EVT_PAGE_EVALUATE runs after after scripts have run, etc.
     */
    public static EVT_PAGE_LOAD: string = 'page-load';

    /**
     * @event
     * Emits when the underlying page's scripts have run, etc.
     */
    public static EVT_PAGE_EVALUATE: string = 'page-evaluate';

    /**
     * @event
     * Emits, with an Error object, if the page crashes.
     * @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#event-error
     */
    public static EVT_PAGE_CRASH_ERROR: string = 'page-crash-error';

    /**
     * @event
     * Emits, with the exception message, when an uncaught exception happens within the page.
     * @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#event-pageerror
     */
    public static EVT_PAGE_EXCEPTION_ERROR: string = 'page-exception-error';

    /**
     * @event
     * Emits when the underlying page has closed.
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
     * Emits when the engine has closed, or has been terminated.
     */
    public static EVT_CLOSE: string = 'close';

    protected _events: EventEmitter;
    protected _options: IPuppeteerRequestOptions = {
        isJavaScriptEnabled: true // Set JavaScript enabled to be true, by default
    };

    protected _browser: any;
    protected _url: string = '';
    protected _redirectedURL: string = '';
    protected _pageHTML: string = '';
    protected _hasEvaluatedPage: boolean = false;
    protected _httpStatusCode: number = 0;

    /**
     * 
     * @param url {string} The URL to capture. Note that this is currently only available as a GET request.
     * @param options {object} IPuppeteerRequestOptions
     */
    constructor(url: string, options?: IPuppeteerRequestOptions) {
        this._url = this._getFixedURL(url);

        if (typeof options !== 'undefined') {
            this._options = options;
        }

        this._events = new EventEmitter();

        this.on(Puppeteer.EVT_PAGE_EVALUATE, () => {
            this._hasEvaluatedPage = true;
        });
    }

    /**
     * Adds a protocol to the URL if it's not there already.
     */
    protected _getFixedURL(url: string): string {
        const re = (RegExp('^https?://', 'i'));
        const hasScheme = re.test(url);
        if (!hasScheme) {
            // Prefix HTTP scheme
            url = 'http://' + url;
        }

        return url;
    }

    /**
     * Retrieves the original URL (after protocol fixes, etc.).
     */
    public getOriginURL(): string {
        return this._url;
    }

    /**
     * Retrieves the URL after all redirects have happened.
     * 
     * (e.g. "http" to "https" 301 redirects)
     */
    public getRedirectedURL(): string {
        return this._redirectedURL;
    }

    /**
     * Retrieves the HTTP status code after the request has been performed.
     * 
     * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
     */
    public getHTTPStatusCode(): number {
        return this._httpStatusCode;
    }

    /**
     * Retrieves whether the browser engine has completed a page load.
     */
    public getHasEvaluatedPage(): boolean {
        return this._hasEvaluatedPage;
    }

    /**
     * Returns the HTML of the page.
     */
    public getPageHTML(): string {
        return this._pageHTML;
    }

    /**
     * Retrieves the engines set to the internal browser engine.
     * 
     * @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerdefaultargs
     * 
     * For a list of Chromium command line switches:
     * @see https://peter.sh/experiments/chromium-command-line-switches/
     */
    public getEngineOptions(): IPuppeteerLaunchOptions {
        return {
            // Chromium command line switches
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ],
            ignoreHTTPSErrors: true, // Whether to ignore HTTPS errors during navigation. Defaults to false.
            headless: true, // Whether to run browser in headless mode. Defaults to true unless the devtools option is true.
            timeout: 10000, // Maximum time in milliseconds to wait for the browser instance to start. Defaults to 30000 (30 seconds). Pass 0 to disable timeout.
            dumpio: false, // Whether to pipe the browser process stdout and stderr into process.stdout and process.stderr. Defaults to false.
            userDataDir: '/dev/null', // Path to a User Data Directory.
            env: process.env, // Specify environment variables that will be visible to the browser. Defaults to process.env.
            devtools: false, // Whether to auto-open a DevTools panel for each tab. If this option is true, the headless option will be set false.
            pipe: true // Connects to the browser over a pipe instead of a WebSocket. Defaults to false.
        };
    }

    /**
     * Registers an event listener.
     */
    on(eventName: string, listener: (...args: any[]) => void): void {
        this._events.on(eventName, listener);
    }

    /**
     * Unregisters an event listener.
     */
    off(eventName: string, listener: (...args: any[]) => void): void {
        this._events.off(eventName, listener);
    }

    /**
     * Fetches the URL.
     */
    fetch(): Promise<{}> {
        if (this._browser) {
            throw new Error('Cannot refetch');
        }

        const self = this;

        var promise = new Promise((resolve: () => void, reject: (reason?: any) => void) => {
            try {
                (async () => {
                    self._browser = await puppeteer
                        .launch(self.getEngineOptions())
                        .then(async (browser) => {
                            // Ensure we've got the same object running as a property
                            self._browser = browser;
        
                            let page;
        
                            try {
                                page = await browser.newPage();
        
                                // Request interception is handled in page on "request" event handler
                                page.setRequestInterception(true);
        
                                page.setJavaScriptEnabled(self._options.isJavaScriptEnabled);
                                console.log('Set JS enabled value to:', self._options.isJavaScriptEnabled);
        
                                // Bind page events
                                self._bindPageEvents(page);
        
                                const mainResponse: puppeteer.Response | null = await page.goto(self._url);
                                
                                if (!mainResponse) {
                                    throw new Error('Did not retrieve a response');
                                }
        
                                self._redirectedURL = mainResponse.url();
                                self._httpStatusCode = mainResponse.status();
        
                                // self._redirectedURL = page.url();
        
                                // Note, page.evaluate() has its own DOM in its scope, but we must declare it here
                                let evaluationData;
                                // let window: any;
                                let document: any;
                                evaluationData = await page.evaluate(() => {
                                    return {
                                        // width: document.documentElement.clientWidth,
                                        // height: document.documentElement.clientHeight,
                                        // deviceScaleFactor: window.devicePixelRatio,
                                        // url: window.location.href,
                                        pageHTML: document.documentElement.outerHTML
                                    };
                                });
                                self._pageHTML = evaluationData.pageHTML;
        
                                // Emit page evaluation event
                                self._events.emit(Puppeteer.EVT_PAGE_EVALUATE);

                                resolve();
        
                            } catch (err) {
                                self._emitError(Puppeteer.EVT_ERROR, err);
        
                                self.terminate();
                                
                                reject();
                            }
        
                        }).catch((err) => {
                            self._emitError(Puppeteer.EVT_ERROR, err);
        
                            self.terminate();

                            reject();
                        });
                })();
            } catch (err) {
                self._emitError(Puppeteer.EVT_ERROR, err);
            }
        });

        return promise;
    }

    protected _emitError(errorType: string, error: Error | any) {
        console.error(errorType, error);

        if (errorType !== Puppeteer.EVT_ERROR) {
            this._events.emit(errorType, error);
        }

        // Emit when any type of error has been thrown
        this._events.emit(Puppeteer.EVT_ERROR, error);
    }

    /**
     * Closes Chromium and all of its pages (if any were opened).
     * The Browser object itself is considered to be disposed and cannot be used anymore.
     */
    public terminate(): void {
        if (!this._browser) {
            console.error('Browser is not set');
            return;
        }

        this._browser.close();
        // TODO: Listen to browser close event instead, if possible
        this._events.emit(Puppeteer.EVT_CLOSE);
    }

    /**
     * Binds internal page events to the class.
     * 
     * @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-page
     */
    protected _bindPageEvents(page: puppeteer.Page): void {
        const self = this;

        page.once('load', () => {
            self._events.emit(Puppeteer.EVT_PAGE_LOAD);
        });

        page.on('error', (error: Error) => {
            self._emitError(Puppeteer.EVT_PAGE_CRASH_ERROR, error);
        });

        page.on('pageerror', (e: string, ...args: any[]) => {
            self._emitError(Puppeteer.EVT_PAGE_EXCEPTION_ERROR, {
                e: e,
                args: args
            });
        });

        // Note, we can filter URL types by using interceptedURL here
        page.on('request', (request: puppeteer.Request) => {
            // For debugging
            let isToFulfill: boolean = true;

            // const interceptedURL: string = request.url();

            /*if (interceptedURL.endsWith('.js')) {
                request.continue();
            } else {
                console.log('Blocking intercepted request URL: ' + interceptedURL);
                request.abort();
            }*/

            /*if (request.url() === self._url ||
                request.url() === self._redirectedURL) {
                isToFulfill = true;
                request.continue();
            } else {
                isToFulfill = false;
                request.abort();
            }*/
 
            const pageRequest: IPuppeteerPageRequest = {
                url: request.url(),
                method: request.method(),
                headers: request.headers(),
                postData: request.postData(),
                resourceType: request.resourceType(),
                isToFulfill: isToFulfill
            };

            console.log(pageRequest);

            self._events.emit(Puppeteer.EVT_PAGE_REQUEST, pageRequest);

            if (isToFulfill) {
                request.continue();
            }
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
                isCached: response.fromCache(), // Whether the response was served from either the browser's disk cache or memory cache
                isFromServiceWorker: response.fromServiceWorker(),
                headers: response.headers(),
                isSuccess: response.ok(), // Whether the response was successful (status in the range 200-299) or not
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
    IPuppeteerRequestOptions,
    IPuppeteerPageRequest,
    IPuppeteerPageResponse
};