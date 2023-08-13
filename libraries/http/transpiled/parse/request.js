"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = void 0;
const http_parser_js_1 = require("http-parser-js");
function request(input) {
    const parser = new http_parser_js_1.HTTPParser(http_parser_js_1.HTTPParser.REQUEST);
    const request = {};
    let complete = false;
    parser[http_parser_js_1.HTTPParser.kOnHeadersComplete] = function (req) {
        request.method = http_parser_js_1.HTTPParser.methods[req.method];
        request.url = req.url;
        request.headers = reduceHeaders(req.headers);
    };
    parser[http_parser_js_1.HTTPParser.kOnMessageComplete] = function () {
        complete = true;
    };
    const buffer = Buffer.from(input);
    parser.execute(buffer);
    parser.finish();
    if (!complete)
        throw new Error('Failed to parse the request');
    return request;
}
exports.request = request;
function reduceHeaders(array) {
    const headers = {};
    while (array.length > 1) {
        const name = array.shift();
        const value = array.shift();
        if (name === undefined || value === undefined)
            throw new Error('Error parsing headers');
        headers[name] = value;
    }
    return headers;
}
//# sourceMappingURL=request.js.map