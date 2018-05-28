import express from 'express';
import { Puppeteer } from './Puppeteer';
import HTMLParser from './HTMLParser';

class APIServer {
    protected _app: express.Express;

    constructor (app: express.Express) {
        this._app = app;

        this._initRoutes();
    }

    protected _toBoolean(value: number | boolean): boolean {
        if (value === 1 || value === true) {
            return true;
        } else {
            return false;
        }
    }
    
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
         * @api {get} /?url={url}&format={format}
         * 
         * @apiParam {string} url Url of resource to fetch.
         * @apiParam {string} format (optional) The response format, default is JSON.
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
            puppeteer.on('close', () => {
                if (isPassedToContentParser) {
                    return;
                }

                if (!res.headersSent) {
                    res.send('(Empty response)');
                }
            });

            puppeteer.on('page-source', (html: string) => {
                const htmlParser = new HTMLParser(html, url);
                
                isPassedToContentParser = true;

                htmlParser.on(HTMLParser.EVT_READY, () => {
                    res.send(htmlParser.getCondensedHTML());

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

export default APIServer;