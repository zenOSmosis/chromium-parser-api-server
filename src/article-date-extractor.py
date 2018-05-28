import sys, json, articleDateExtractor

#Read data from stdin
def read_in():
    readIn = sys.stdin.read()
    
    return readIn

def main():
    #get our data as an array from read_in()
    readIn = read_in()
    
    data = json.loads(readIn)
    url = data["url"]
    html = data["html"]

    # TODO: Temporarily re-route stdout until d is obtained and update JS reader
    d = articleDateExtractor.extractArticlePublishedDate(url, html)

    print (d)

#start process
if __name__ == '__main__':
    main()