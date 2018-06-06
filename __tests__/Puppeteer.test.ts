import express from 'express';
const expressServer = express();
import { Puppeteer, IPuppeteerPageRequest } from './../src/Puppeteer';
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

it ('Test URL Protocol Fixing', async (done) => {
    const puppeteer1 = new Puppeteer('127.0.0.1:9090/test-html/test1.html');
    expect(puppeteer1.getOriginURL()).toBe('http://127.0.0.1:9090/test-html/test1.html');

    const puppeteer2 = new Puppeteer('http://127.0.0.1:9090/test-html/test1.html');
    expect(puppeteer2.getOriginURL()).toBe('http://127.0.0.1:9090/test-html/test1.html');

    const puppeteer3 = new Puppeteer('https://127.0.0.1:9090/test-html/test1.html');
    expect(puppeteer3.getOriginURL()).toBe('https://127.0.0.1:9090/test-html/test1.html');

    done();
});

it('Test JavaScript Enabled', async (done) => {
    const puppeteer = new Puppeteer('127.0.0.1:9090/test-html/test1.html');

    puppeteer.on(Puppeteer.EVT_ERROR, (err) => {
        throw new Error(err);
    });

    expect(puppeteer.getHasEvaluatedPage()).toBe(false);
    expect(puppeteer.getRedirectedURL()).toBe('');
    expect(puppeteer.getHTTPStatusCode()).toBe(0);

    await puppeteer.fetch();

    expect(puppeteer.getHasEvaluatedPage()).toBe(true);
    expect(puppeteer.getRedirectedURL()).toBe('http://127.0.0.1:9090/test-html/test1.html');
    expect(puppeteer.getHTTPStatusCode()).toBe(200);

    expect(puppeteer.getUserAgent().toLowerCase().indexOf('headless')).toBe(-1);
    expect(puppeteer.getClientWidth()).toBeGreaterThan(0);
    expect(puppeteer.getClientHeight()).toBeGreaterThan(0);
    expect(puppeteer.getDeviceScaleFactor()).toBeGreaterThan(0);
    
    const receivedPageHTML: string = puppeteer.getPageHTML();
    const vdom: JSDOM = new JSDOM(receivedPageHTML);
    const bodyHTML: string = vdom.window.document.body.innerHTML;

    expect(bodyHTML.trim()).toBe('Hello World!');

    puppeteer.terminate();

    done();
});

// Tests which hide the identity of the automation engine on public websites
it('Test Stealth Mode', async (done) => {
    const puppeteer = new Puppeteer('127.0.0.1:9090/test-html/test1.html', {
        isJavaScriptEnabled: false
    });

    puppeteer.on(Puppeteer.EVT_ERROR, (err) => {
        throw new Error(err);
    });

    let iRequest = -1;
    puppeteer.on(Puppeteer.EVT_PAGE_REQUEST, (request: IPuppeteerPageRequest) => {
        iRequest++;
        // Ensure "x-devtools-emulate-network-conditions-client-id" headers is not in the request
        if (typeof request.headers['x-devtools-emulate-network-conditions-client-id'] !== 'undefined') {
            throw new Error('"x-devtools-emulate-network-conditions-client-id" should not exist as a header');
        }
    });

    await puppeteer.fetch();

    // Expect at least one page request to be made
    expect(iRequest).toBeGreaterThan(-1);

    done();
});

it('Test JavaScript Disabled', async (done) => {
    const puppeteer = new Puppeteer('127.0.0.1:9090/test-html/test1.html', {
        isJavaScriptEnabled: false
    });

    puppeteer.on(Puppeteer.EVT_ERROR, (err) => {
        throw new Error(err);
    });

    expect(puppeteer.getHasEvaluatedPage()).toBe(false);

    await puppeteer.fetch();

    expect(puppeteer.getHasEvaluatedPage()).toBe(true);
    expect(puppeteer.getRedirectedURL()).toBe('http://127.0.0.1:9090/test-html/test1.html');
    expect(puppeteer.getHTTPStatusCode()).toBe(200);

    expect(puppeteer.getUserAgent().toLowerCase().indexOf('headless')).toBe(-1);
    expect(puppeteer.getClientWidth()).toBeGreaterThan(0);
    expect(puppeteer.getClientHeight()).toBeGreaterThan(0);
    expect(puppeteer.getDeviceScaleFactor()).toBeGreaterThan(0);
            
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
        throw new Error(err);
    });

    await puppeteer.fetch();

    console.log('Expecting an error here');

    let didThrowException: boolean;
    try {
        await puppeteer.fetch();

        didThrowException = false;
    } catch (exc) {
        didThrowException = true;

        // TODO: Fix this up; it's rather nasty
        expect(exc.toString()).toBe('Error: Error: Cannot refetch');
    }
    if (!didThrowException) {
        throw new Error('Expected an exception!');
    }

    puppeteer.terminate();

    done();
});