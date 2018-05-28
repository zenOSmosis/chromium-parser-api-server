import express from 'express';
import { Puppeteer } from './Puppeteer';
import HTMLParser from './HTMLParser';

/**
 * Wraps Express with a RESTful API suitable for controlling Puppeteer.
 */
class PuppeteerAPIServer {
    protected _app: express.Express;

    constructor (app: express.Express) {
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
         * Base URI path.
         *
         * @apiSuccessExample Success-Response:
         *     HTTP/1.1 200 OK
         *     Ready
         */
        const _handleRootPath = (req: any, res: any) => {
            res.send('Ready');
        };

        /**
         * @api {get} /?url={url}&jsEnabled={jsEnabled}&format={format}
         * 
         * @apiParam {string} url URL of resource to fetch.
         * @apiParam {boolean} jsEnabled (optional; default is true) Whether the underlying browser engine should use JavaScript.
         * @apiParam {string} format (optional; default is "json") The response format.
         */
        const _handleURLFetch = (req: any, res: any) => {
            let isPassedToContentParser: boolean;

            const puppeteer = new Puppeteer(url, {
                isJavaScriptEnabled: this._getIsJavaScriptEnabled(req.query)
            });

            // Event request output
            puppeteer.on(Puppeteer.EVT_PAGE_REQUEST, (data) => {
                console.log('REQUEST', data);
            });
            puppeteer.on(Puppeteer.EVT_PAGE_RESPONSE, (data) => {
                console.log('RESPONSE', data);
            });

            // Handle prematurely-ended connections
            req.connection.on('close', () => {
                puppeteer.terminate();

                console.log('Puppeteer is closed');
            });

            // Prevent hung pages
            puppeteer.on(Puppeteer.EVT_CLOSE, () => {
                if (isPassedToContentParser) {
                    return;
                }

                if (!res.headersSent) {
                    res.send('(Empty response)');
                }
            });

            puppeteer.on(Puppeteer.EVT_PAGE_SOURCE, (html: string) => {
                const htmlParser = new HTMLParser(html, url);
                
                isPassedToContentParser = true;

                htmlParser.on(HTMLParser.EVT_READY, () => {
                    var data = {
                        condensedHTML: htmlParser.getCondensedHTML(),
                        author: htmlParser.getAuthor(),
                        title: htmlParser.getTitle(),
                        iconURL: htmlParser.getIconURL(),
                        previewImageURL: htmlParser.getPreviewImageURL(),
                        provider: htmlParser.getProvider(),
                        description: htmlParser.getDescription(),
                        keywords: htmlParser.getKeywords(),
                        publishedDate: htmlParser.getPublishedDate(),
                        type: htmlParser.getType()
                    };
                    res.send(JSON.stringify(data));
                    // res.send(htmlParser.getCondensedHTML());

                    puppeteer.terminate();
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