import express from 'express';
import { Puppeteer } from './Puppeteer';
import HTMLParser from './HTMLParser';

interface IAPISuccessResponse {
    url: string;
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
        let url: string;

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
        const _handleRootPath = (req: any, res: any) => {
            res.send('Ready');
        };

        /**
         * @api {get} /?url={url}&jsEnabled={jsEnabled}&format={format}
         * 
         * Get URL parse
         * 
         * @apiExample {curl} Example usage:
         *      curl -i http://localhost:8080?url=https://zenosmosis.com&jsEnabled=1&format=json
         * 
         * @apiParam {string} url URL of resource to fetch.
         * @apiParam {boolean} jsEnabled (optional; default is 1, or true) Whether the underlying browser engine should use JavaScript.
         * @apiParam {string} format (optional; default is "json") The response format.
         * 
         * @apiSuccess {string} url The URL, after all redirects have been performed.
         * @apiSuccess {string} condensedHTML A filtered version of the HTML.
         * @apiSuccess {string} author  Who wrote the page.
         * @apiSuccess {string} title The title of the page.
         * @apiSuccess {string} iconURL A URL which contains the icon for the page.
         * @apiSuccess {string} previewImage A URL which contains a preview image for the page.
         * @apiSuccess {string} provider A string representation of the sub and primary domains.
         * @apiSuccess {string} description A short description of the page.
         * @apiSuccess {string} keywords The keywords for the page.
         * @apiSuccess {string} publishedDate The date of the page publication.
         * @apiSuccess {string} type The type of content, as defined by Open Graph [ @see http://ogp.me/ ].
         * 
         * @apiSuccessExample JSON-formatted Success Response:
         *      HTTP/1.1 200 OK
         *      {
         *          "url": "http://example.com",
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
         * 
         * @apiError {string} error A description of the error.
         * 
         * @apiErrorExample JSON-formatted Error Response:
         *      HTTP/1.1 404 Not Found
         *      {
         *          "error": "Error: net::ERR_FAILED at https://zenosmosis.com"
         *      }
         */
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
                errors.push(error);

                console.error('ERROR', error);
            });

            // Prevent hung pages
            puppeteer.on(Puppeteer.EVT_CLOSE, () => {
                if (isPassedToContentParser) {
                    return;
                }

                if (!res.headersSent) {
                    // TODO: Use a common API response method for this, instead
                    if (errors) {

                        const data: IAPIErrorResponse = {
                            error: errors.toString()
                        };
                        res.statusCode = 404;
                        res.send(JSON.stringify(data));
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
                    // TODO: Use a common API response method for this, instead
                    const data: IAPISuccessResponse = {
                        url: htmlParser.getURL(),
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
                    res.send(JSON.stringify(data));
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
}

export default PuppeteerAPIServer;