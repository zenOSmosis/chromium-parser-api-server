import express from 'express';
import { Puppeteer } from './Puppeteer';
import HTMLParser from './HTMLParser';

interface IAPISuccessResponse {
    url: string;
    proxyHTTPStatusCode?: number;
    fullHTML?: string;
    condensedHTML?: string;
    author?: string;
    title?: string;
    iconURL?: string;
    previewImageURL?: string;
    provider?: string;
    description?: string;
    keywords?: string[];
    publishedDate?: string;
    openGraphType?: string;
}

interface IAPIErrorResponse {
    error: string;
}

/**
 * Wraps Express with a RESTful API suitable for both controlling
 * Puppeteer and routing the data through HTMLParser.
 */
class PuppeteerAPIServer {
    protected _app: express.Express;

    constructor(app: express.Express) {
        this._app = app;

        this._initRoutes();
    }

    /**
     * Converts an Express query value to a boolean value.
     */
    protected _toBoolean(value: number | string | boolean): boolean {
        if (value === 1 || value.toString().toUpperCase() === 'TRUE' || value === true) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Determines if JavaScript in enabled via an Express query object.
     */
    protected _getIsJavaScriptEnabled(query: any): boolean {
        const defaultValue = true;

        if (typeof query.jsEnabled === 'undefined') {
            query.jsEnabled = defaultValue;
        }

        // Convert to boolean
        query.jsEnabled = this._toBoolean(query.jsEnabled);

        return query.jsEnabled;
    }

    /**
     * Initializes API routes.
     * 
     * API doc params @see http://apidocjs.com/#params
     */
    protected _initRoutes(): void {
        const self = this;
        let url: string;

        // Root path should send the API status
        const _handleRootPath = (req: any, res: any) => {
            self._sendStatusResponse(res);
        };

        const _handleURLFetch = (req: any, res: any) => {
            let isPassedToContentParser: boolean;

            const puppeteer = new Puppeteer(url, {
                isJavaScriptEnabled: this._getIsJavaScriptEnabled(req.query)
            });

            let errors: Array<Error> = [];

            // Handle prematurely-ended connections
            // (e.g. if a user disconnects while the process is running)
            req.connection.on('close', () => {
                puppeteer.terminate();

                console.log('Puppeteer is closed');
            });

            puppeteer.on(Puppeteer.EVT_PAGE_REQUEST, (data) => {
                console.log('REQUEST', data);
            });

            puppeteer.on(Puppeteer.EVT_PAGE_RESPONSE, (data) => {
                console.log('RESPONSE', data);
            });

            puppeteer.on(Puppeteer.EVT_ERROR, (error: Error) => {
                // Add the new error to the stack
                errors.push(error);

                console.error('ERROR', error);
            });

            // Prevent hung pages
            puppeteer.on(Puppeteer.EVT_CLOSE, () => {
                if (isPassedToContentParser) {
                    return;
                }

                if (!res.headersSent) {
                    if (errors) {

                        const data: IAPIErrorResponse = {
                            error: errors.toString()
                        };

                        self._sendURLParseResponse(res, data);
                    }
                }
            });

            puppeteer.on(Puppeteer.EVT_PAGE_EVALUATE, () => {
                const html: string = puppeteer.getPageHTML();
                let redirectURL: string = puppeteer.getRedirectedURL();

                const htmlParser = new HTMLParser(html, redirectURL);

                isPassedToContentParser = true;

                // Kill the browser engine
                puppeteer.terminate();

                htmlParser.on(HTMLParser.EVT_READY, () => {
                    const data: IAPISuccessResponse = {
                        url: htmlParser.getURL(),
                        proxyHTTPStatusCode: puppeteer.getHTTPStatusCode(),
                        fullHTML: htmlParser.getHTML(),
                        condensedHTML: htmlParser.getCondensedHTML(),
                        author: htmlParser.getAuthor(),
                        title: htmlParser.getTitle(),
                        iconURL: htmlParser.getIconURL(),
                        previewImageURL: htmlParser.getPreviewImageURL(),
                        provider: htmlParser.getProvider(),
                        description: htmlParser.getDescription(),
                        keywords: htmlParser.getKeywords(),
                        publishedDate: htmlParser.getPublishedDate(),
                        openGraphType: htmlParser.getOpenGraphType()
                    };

                    self._sendURLParseResponse(res, data);
                });

            });

            puppeteer.fetch();
        };

        this._app.get('/', (req: any, res: any) => {
            if (!(url = req.query.url)) {
                _handleRootPath(req, res);
            } else {
                _handleURLFetch(req, res);
            }
        });
    }

    /**
     * @api {get} /
     * 
     * Get API status
     *
     * @apiSuccessExample Success-Response:
     *      HTTP/1.1 200 OK
     *      Ready
     * 
     * @apiErrorExample Error-Response:
     *      HTTP/1.1 404 Not Found
     */
    protected _sendStatusResponse(res: any) {
        res.send('Ready');
    }

    /**
     * @api {get} /?url={url}&jsEnabled={jsEnabled}
     * 
     * Get URL parse
     * 
     * Note that certain parameters may not return if no information is available for them.
     * 
     * @apiExample {curl} Example usage:
     *      curl -i http://localhost:8080?url=https://zenosmosis.com&jsEnabled=1
     * 
     * @apiParam {string} url URL of resource to fetch.
     * @apiParam {boolean} jsEnabled (optional; default is 1, or true) Whether the underlying browser engine should use JavaScript.
     *
     * @apiSuccess {string} url The final URL, after all redirects have been performed.
     * @apiSuccess {number} proxyHTTPStatusCode The HTTP status code of the fetched resource.
     * @apiSuccess {string} fullHTML The full HTML of the fetch resource.
     * @apiSuccess {string} condensedHTML A readable version of the HTML, filtered through Mozilla's Readability algorithm.
     * @apiSuccess {string} author  Who wrote the page.
     * @apiSuccess {string} title The title of the page.
     * @apiSuccess {string} iconURL A URL which contains the icon for the page.
     * @apiSuccess {string} previewImage A URL which contains a preview image for the page.
     * @apiSuccess {string} provider A string representation of the sub and primary domains.
     * @apiSuccess {string} description A short description of the page.
     * @apiSuccess {array} keywords The keywords for the page.
     * @apiSuccess {string} publishedDate The date of the page publication.
     * @apiSuccess {string} type The type of content, as defined by Open Graph [ @see http://ogp.me/ ].
     * 
     * @apiSuccessExample JSON-formatted Success Response:
     *      HTTP/1.1 200 OK
     *      {
     *          "url": "http://example.com",
     *          "proxyHTTPStatusCode": 200,
     *          "fullHTML": "<div>...</div>",
     *          "condensedHTML": "<div>...</div>",
     *          "author": "John Doe",
     *          "title": "My webpage"
     *          "iconURL": "http://example.com/favicon.ico",
     *          "previewImageURL": "http://example.com/preview-1024x683.jpg",
     *          "provider": "Example Website",
     *          "description": "A great website",
     *          "keywords": "great, fun, website",
     *          "publishedDate": "2013-08-12 08:51:00",
     *          "openGraphType": "website"
     *      }
     * 
     * @apiError {string} error A description of the error.
     * @apiErrorExample JSON-formatted Error Response:
     *      HTTP/1.1 404 Not Found
     *      {
     *          "error": "Error: net::ERR_FAILED at https://zenosmosis.com"
     *      }
     */
    protected _sendURLParseResponse(res: any, data: IAPISuccessResponse | IAPIErrorResponse) {
        if ((data as IAPIErrorResponse).error) {
            res.statusCode = 404;
        }

        res.send(JSON.stringify(data));
    }
}

export default PuppeteerAPIServer;