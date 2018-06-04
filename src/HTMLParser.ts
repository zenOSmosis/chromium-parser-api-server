import { JSDOM } from 'jsdom';
import { spawn } from 'child_process';
import EventEmitter from 'events';
const { getMetadata } = require('page-metadata-parser');
// TODO: Add Readability types and convert to use import statement
// import Readability from 'readability';
const Readability: any = require('readability');

interface IPageMetadata {
    description: string;
    icon: string;
    image: string;
    keywords: string[];
    title: string;
    type: string;
    url: string;
    provider: string;
}

interface IReadable {
    title: string;
    content: string;
    length: number;
    excerpt: string;
    byline: string;
    dir: string;
}

class HTMLParser {
    /**
     * @event
     * Emits when class has finished parsing.
     */
    public static EVT_READY: 'ready';

    protected static PYTHON_ARTICLE_DATE_EXTRACTOR_PATH: string = __dirname + '/article-date-extractor.py';

    protected _events: EventEmitter;

    protected _url: string = '';
    protected _html: string | undefined = '';
    protected _condensedHTML: string | undefined = '';
    protected _author: string | undefined = '';
    protected _description: string | undefined = '';
    protected _iconURL: string | undefined = '';
    protected _previewImageURL: string | undefined = '';
    protected _keywords: string[] | undefined = [];
    protected _title: string | undefined = '';
    protected _openGraphType: string | undefined = '';
    protected _provider: string | undefined = '';
    protected _publishedDate: string | undefined = '';

    protected _isReady: boolean;

    constructor(html: string, url: string) {
        this._html = html;
        this._url = url;

        this._events = new EventEmitter();

        this._init();
    }

    public on(eventName: string, listener: (...args: any[]) => void): void {
        this._events.on(eventName, listener);
    }

    public off(eventName: string, listener: (...args: any[]) => void): void {
        this._events.off(eventName, listener);
    }

    /**
     * The original URL.
     */
    public getURL(): string {
        return this._get('url');
    }

    /**
     * Returns the original HTML sent to the class.
     * 
     * Typically, this may include the entire outer HTML of the DOM.
     */
    public getHTML(): string | undefined {
        return this._get('html');
    }

    /**
     * Returns a readable version of the HTML, if it exists.
     * 
     * This does not include HEAD or BODY tags.
     */
    public getCondensedHTML(): string | undefined {
        return this._get('condensedHTML');
    }

    /**
     * Returns the author of the article, if available.
     */
    public getAuthor(): string | undefined {
        return this._get('author');
    }

    /**
     * Retrieves the title of the article, if available.
     */
    public getTitle(): string | undefined {
        return this._get('title');
    }

    /**
     * Retrieves the "favicon" of the page, if exists.
     */
    public getIconURL(): string | undefined {
        return this._get('iconURL');
    }

    /**
     * A URL which contains a preview image for the page.
     */
    public getPreviewImageURL(): string | undefined {
        return this._get('previewImageURL');
    }

    /**
     * A string presentation of the sub and primary domains.
     */
    public getProvider(): string | undefined {
        return this._get('provider');
    }

    public getDescription(): string | undefined {
        return this._get('description');
    }

    // TODO: Implement keyword filtering
    public getKeywords(): string[] | undefined {
        return this._get('keywords');
    }

    public getPublishedDate(): string | undefined {
        return this._get('publishedDate');
    }

    /**
     * The type of content as defined by Open Graph.
     * 
     * @see http://ogp.me/#types
     */
    public getOpenGraphType(): string {
        return this._get('openGraphType');
    }

    protected _get(key: string): any | string[] {
        if (!this._isReady) {
            throw new Error('Class is not ready');
        }

        const privKey: string = '_' + key;

        if (!this.hasOwnProperty(privKey)) {
            throw new Error('Missing key: ' + key);
        } else {
            return this[privKey];
        }
    }

    protected _getMetatagData(): IPageMetadata | undefined {
        const virtualDOM = new JSDOM(this._html, {
            url: this._url // TODO: Use parsed URL
        });

        try {
            const metadata: IPageMetadata = getMetadata((virtualDOM.window as any).document, this._url);

            return metadata;
        } catch (exc) {
            return;
        }
    }

    /**
     * Retrieves readable content, but not the entire HTML body.
     */
    protected _getReadable(): IReadable | undefined {
        const virtualDOM = new JSDOM(this._html, {
            url: this._url // TODO: Use parsed URL
        });

        // TODO: Is there an error in the type?  (@type module asks for Document here)
        const readable = new Readability((virtualDOM.window as any).document).parse();

        if (readable) {
            return {
                title: readable.title,
                content: readable.content,
                length: readable.length,
                excerpt: readable.excerpt,
                byline: readable.byline,
                dir: readable.dir
            };
        } else {
            return;
        }
    }

    /**
     * Initializes the class for external consumption, then emits a "ready" event.
     */
    protected _init(): void {
        this._fetchPublishedDate((err, date) => {            
            if (err) {
                console.error(err);
            } else {
                if (date) {
                    this._publishedDate = date as string;
                }
                
                const readable = this._getReadable();

                if (readable) {
                    this._condensedHTML = readable.content;
                    this._author = readable.byline;
                }

                const metadata = this._getMetatagData();
                if (metadata) {
                    this._description = metadata.description;
                    this._iconURL = metadata.icon;
                    this._previewImageURL = metadata.image;
                    this._keywords = metadata.keywords || [];
                    this._title = metadata.title;
                    this._openGraphType = metadata.type;
                    this._provider = metadata.provider;
                }

                // Class is ready for consumption
                this._isReady = true;
                this._events.emit(HTMLParser.EVT_READY);
            }
        });
    }

    /**
     * Automatically extracts and normalizes an online article or blog post publication date.
     * 
     * @see https://github.com/zenOSmosis/article-date-extractor
     * 
     * TODO: Convert to a promise.
     * @see https://developers.google.com/web/fundamentals/primers/promises
     */
    protected _fetchPublishedDate(onFetch: (err: string | null, date?: string | undefined) => void) {
        const url: string = this._url;
        const html: string | undefined = this._html;

        try {
            const dateExtractor = spawn('python', [HTMLParser.PYTHON_ARTICLE_DATE_EXTRACTOR_PATH]);

            var writeData = {
                url: url,
                html: html
            };

            var err: string | null;
            var date: string | undefined;

            dateExtractor.stdout.on('data', (buffer) => {
                // console.log('STDOUT', buffer.toString());
                
                var output = buffer.toString();
                
                // TODO: Remove this hack after fixing Python script
                var lines = output.split("\n");
                if (typeof lines[1] !== 'undefined' &&
                    lines[1] !== 'None') {
                    date = lines[1];
                }
            });

            dateExtractor.stderr.on('data', (buffer) => {
                // console.error(buffer.toString());
                err = buffer.toString();
            });

            dateExtractor.on('close', (code, signal) => {
                // console.log('ended data extractor', code, signal);

                if (typeof onFetch === 'function') {
                    onFetch(err, date);
                }
            });

            dateExtractor.stdin.write(JSON.stringify(writeData));
            dateExtractor.stdin.end();
        } catch (err) {
            console.error(err);
            if (typeof onFetch === 'function') {
                onFetch(err);
            }
        }
    }
}

export default HTMLParser;