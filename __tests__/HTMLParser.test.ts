import HTMLParser from './../src/HTMLParser';
import fs from 'fs';

const url: string = 'https://www.bloomberg.com/news/articles/2018-05-31/america-s-teens-are-choosing-youtube-over-facebook';
const html: string = fs.readFileSync(__dirname + '/html/bloomberg.com/news/articles/2018-05-31/america-s-teens-are-choosing-youtube-over-facebook.html').toString();

it('Test HTML Parser', async (done) => {
    var htmlParser = new HTMLParser(html, url);

    htmlParser.on(HTMLParser.EVT_READY, () => {
        // expect('this').toBe(htmlParser);
        
        expect(htmlParser.getURL()).toBe('https://www.bloomberg.com/news/articles/2018-05-31/america-s-teens-are-choosing-youtube-over-facebook');
        expect(htmlParser.getHTML()).toContain('<h1 class="lede-text-v2__hed">America’s Teens Are Choosing YouTube Over Facebook</h1>');
        expect(htmlParser.getCondensedHTML()).toContain('<div id=\"readability-page-1\" class=\"page\">');
        expect(htmlParser.getAuthor()).toContain('Sarah Frier');
        expect(htmlParser.getTitle()).toBe('America’s Teens Are Choosing YouTube Over Facebook');
        expect(htmlParser.getIconURL()).toBe('https://assets.bwbx.io/s3/javelin/public/javelin/images/favicon-black-12c7d129b0.png');
        expect(htmlParser.getPreviewImageURL()).toBe('https://assets.bwbx.io/images/users/iqjWHBFdfxIU/ifmFgJJjWYA4/v0/1200x800.jpg');
        expect(htmlParser.getProvider()).toBe('Bloomberg.com');
        expect(htmlParser.getDescription()).toBe('Snapchat and even Facebook’s own Instagram are getting more clicks from the kids these days than the aging social network.');
        expect(htmlParser.getKeywords().indexOf('Social Network')).toBeGreaterThan(-1);
        expect(htmlParser.getPublishedDate()).toBe('2018-05-31 14:00:12.769000+00:00');

        done();
    });
});

