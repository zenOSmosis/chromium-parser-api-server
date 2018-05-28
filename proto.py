import articleDateExtractor

d = articleDateExtractor.extractArticlePublishedDate("http://edition.cnn.com/2015/11/28/opinions/sutter-cop21-paris-preview-two-degrees/index.html")

print (d)

d = articleDateExtractor.extractArticlePublishedDate("http://techcrunch.com/2015/11/29/tyro-payments/")

print (d)