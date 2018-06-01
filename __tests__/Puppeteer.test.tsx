import express from 'express';
const expressServer = express();
import { Puppeteer } from './../src/Puppeteer';
import { JSDOM } from 'jsdom';

expressServer.use('/test-html', express.static('/app/__tests__/html'));

it('Test JavaScript Enabled', async (done) => {
    var server = expressServer.listen(9090, function() {
            const puppeteer = new Puppeteer('http://127.0.0.1:9090/test-html/test1.html');

            puppeteer.on(Puppeteer.EVT_ERROR, (err) => {
                throw new Error('Test error', err);
            });
            
            puppeteer.on(Puppeteer.EVT_PAGE_EVALUATE, () => {
                expect(puppeteer.getHasEvaluatedPage()).toBe(true);

                expect(puppeteer.getRedirectedURL()).toBe('http://127.0.0.1:9090/test-html/test1.html');
                
                expect(puppeteer.getHTTPStatusCode()).toBe(200);
                
                const receivedPageHTML: string = puppeteer.getPageHTML();
                const vdom: JSDOM = new JSDOM(receivedPageHTML);
                const bodyHTML: string = vdom.window.document.body.innerHTML;

                expect(bodyHTML.trim()).toBe('Hello World!');

                puppeteer.terminate();
                server.close();
            
                done();
            });

            puppeteer.fetch();
        });
    }
});

it('Test JavaScript Disabled', async (done) => {
    var server = expressServer.listen(9090, function() {
            const puppeteer = new Puppeteer('http://127.0.0.1:9090/test-html/test1.html', {
                isJavaScriptEnabled: false
            });

            puppeteer.on(Puppeteer.EVT_ERROR, (err) => {
                throw new Error('Test error', err);
            });
            
            puppeteer.on(Puppeteer.EVT_PAGE_EVALUATE, () => {
                expect(puppeteer.getHasEvaluatedPage()).toBe(true);

                expect(puppeteer.getRedirectedURL()).toBe('http://127.0.0.1:9090/test-html/test1.html');
                
                expect(puppeteer.getHTTPStatusCode()).toBe(200);
                
                const receivedPageHTML: string = puppeteer.getPageHTML();
                const vdom: JSDOM = new JSDOM(receivedPageHTML);
                const bodyScriptHTML: string = vdom.window.document.body.getElementsByTagName('script')[0].innerHTML;

                expect(bodyScriptHTML.trim()).toBe(`document.body.innerHTML = 'Hello World!';`);

                puppeteer.terminate();
                server.close();
            
                done();
            });

            puppeteer.fetch();
        });
    }
});