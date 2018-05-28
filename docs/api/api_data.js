define({ "api": [
  {
    "type": "get",
    "url": "/",
    "title": "Base URI path.",
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\nReady",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "src/PuppeteerAPIServer.ts",
    "group": "_app_src_PuppeteerAPIServer_ts",
    "groupTitle": "_app_src_PuppeteerAPIServer_ts",
    "name": "Get"
  },
  {
    "type": "get",
    "url": "/?url={url}&jsEnabled={jsEnabled}&format={format}",
    "title": "",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "url",
            "description": "<p>URL of resource to fetch.</p>"
          },
          {
            "group": "Parameter",
            "type": "boolean",
            "optional": false,
            "field": "jsEnabled",
            "description": "<p>(optional; default is true) Whether the underlying browser engine should use JavaScript.</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "format",
            "description": "<p>(optional; default is &quot;json&quot;) The response format.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/PuppeteerAPIServer.ts",
    "group": "_app_src_PuppeteerAPIServer_ts",
    "groupTitle": "_app_src_PuppeteerAPIServer_ts",
    "name": "GetUrlUrlJsenabledJsenabledFormatFormat"
  }
] });
