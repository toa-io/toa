"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = request;
const http_parser_js_1 = require("http-parser-js");
function request(input, origin) {
    const parser = new http_parser_js_1.HTTPParser(http_parser_js_1.HTTPParser.REQUEST);
    const request = {};
    const bodyChunks = [];
    let complete = false;
    parser[http_parser_js_1.HTTPParser.kOnHeadersComplete] = function (req) {
        request.method = http_parser_js_1.HTTPParser.methods[req.method];
        request.url = req.url;
        request.headers = reduceHeaders(req.headers);
        if (request.headers.get('host') === null && origin !== undefined)
            request.headers.set('host', new URL(origin).host);
    };
    parser[http_parser_js_1.HTTPParser.kOnBody] = function (chunk, offset, length) {
        bodyChunks.push(chunk.subarray(offset, offset + length));
    };
    parser[http_parser_js_1.HTTPParser.kOnMessageComplete] = function () {
        complete = true;
    };
    const buffer = Buffer.from(input);
    parser.execute(buffer);
    parser.finish();
    if (!complete) {
        console.error(input);
        throw new Error('Failed to parse request');
    }
    if (bodyChunks.length > 0)
        request.body = Buffer.concat(bodyChunks);
    return request;
}
function reduceHeaders(array) {
    const headers = new Headers();
    while (array.length > 1) {
        const name = array.shift();
        const value = array.shift();
        if (name === undefined || value === undefined)
            throw new Error('Error parsing headers');
        headers.append(name, value);
    }
    return headers;
}
//# sourceMappingURL=request.js.map