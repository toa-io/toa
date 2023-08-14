"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require("./");
it('should be', async () => {
    expect(_1.request).toBeInstanceOf(Function);
});
it('should perform http request', async () => {
    const httpRequest = 'GET http://localhost:8888 HTTP/1.1\n\n';
    const httpResponse = await (0, _1.request)(httpRequest);
    expect(httpResponse).toMatch('200 OK');
});
it('should perform http request with headers', async () => {
    const httpRequest = 'GET http://localhost:8888 HTTP/1.1\naccept: appication/json\n\n';
    const httpResponse = await (0, _1.request)(httpRequest);
    expect(httpResponse).toMatch('200 OK');
    expect(httpResponse).toMatch('content-type: application/json');
    expect(httpResponse).toMatch('"hostname":"localhost"');
});
it('should use origin', async () => {
    const httpRequest = 'GET / HTTP/1.1\n\n';
    const httpResponse = await (0, _1.request)(httpRequest, 'http://localhost:8888');
    expect(httpResponse).toMatch('200 OK');
});
//# sourceMappingURL=request.test.js.map