import express from 'express';
const expressServer = express();
import { Puppeteer } from './../src/Puppeteer';
import { JSDOM } from 'jsdom';

expressServer.use('/test-html', express.static('/app/__tests__/html'));

let server;
beforeAll(async () => {
    await new Promise((resolve: () => void, reject: (reason?) => void) => {
        server = expressServer.listen(9090, function(){
            resolve();
        });
    });
});

afterAll(() => {
    server.close();
});

it('Test JavaScript Enabled', async (done) => {
    const puppeteer = new Puppeteer('http://127.0.0.1:9090/test-html/test1.html');

    puppeteer.on(Puppeteer.EVT_ERROR, (err) => {
        throw new Error('Test error', err);
    });

    expect(puppeteer.getHasEvaluatedPage()).toBe(false);
    expect(puppeteer.getRedirectedURL()).toBe('');
    expect(puppeteer.getHTTPStatusCode()).toBe(0);

    await puppeteer.fetch();

    expect(puppeteer.getHasEvaluatedPage()).toBe(true);
    expect(puppeteer.getRedirectedURL()).toBe('http://127.0.0.1:9090/test-html/test1.html');
    expect(puppeteer.getHTTPStatusCode()).toBe(200);
    
    const receivedPageHTML: string = puppeteer.getPageHTML();
    const vdom: JSDOM = new JSDOM(receivedPageHTML);
    const bodyHTML: string = vdom.window.document.body.innerHTML;

    expect(bodyHTML.trim()).toBe('Hello World!');

    puppeteer.terminate();

    done();
});

it('Test JavaScript Disabled', async (done) => {
    const puppeteer = new Puppeteer('http://127.0.0.1:9090/test-html/test1.html', {
        isJavaScriptEnabled: false
    });

    puppeteer.on(Puppeteer.EVT_ERROR, (err) => {
        throw new Error('Test error', err);
    });

    expect(puppeteer.getHasEvaluatedPage()).toBe(false);

    await puppeteer.fetch();

    expect(puppeteer.getHasEvaluatedPage()).toBe(true);
    expect(puppeteer.getRedirectedURL()).toBe('http://127.0.0.1:9090/test-html/test1.html');
    expect(puppeteer.getHTTPStatusCode()).toBe(200);
            
    const receivedPageHTML: string = puppeteer.getPageHTML();
    const vdom: JSDOM = new JSDOM(receivedPageHTML);
    const bodyScriptHTML: string = vdom.window.document.body.getElementsByTagName('script')[0].innerHTML;

    expect(bodyScriptHTML.trim()).toBe(`document.body.innerHTML = 'Hello World!';`);

    puppeteer.terminate();

    done();
});

it('Test Prevent Fetch After Terminate', async (done) => {
    const puppeteer = new Puppeteer('http://127.0.0.1:9090/test-html/test1.html', {
        isJavaScriptEnabled: false
    });

    puppeteer.on(Puppeteer.EVT_ERROR, (err) => {
        throw new Error('Test error', err);
    });

    await puppeteer.fetch();

    let didThrowException: boolean;
    try {
        await puppeteer.fetch();

        didThrowException = false;
    } catch (exc) {
        didThrowException = true;

        expect(exc.toString()).toBe('Error: Cannot refetch');
    }
    if (!didThrowException) {
        throw new Error('Expected an exception!');
    }

    puppeteer.terminate();

    done();
});