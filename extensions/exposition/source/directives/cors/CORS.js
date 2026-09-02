"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CORS = void 0;
/** What is allowed before any directive asks for more. */
const REQUEST_HEADERS = [
    'accept',
    'authorization',
    'content-type',
    'if-match',
    'if-none-match'
];
class CORS {
    name = 'cors';
    requestHeaders = new Set(REQUEST_HEADERS);
    headers = new Headers({
        'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, LOCK, UNLOCK',
        'access-control-allow-credentials': 'true',
        'access-control-allow-headers': this.allowedHeaders(),
        'access-control-max-age': '3600',
        'cache-control': 'max-age=3600',
        vary: 'origin'
    });
    intercept(input) {
        const origin = input.request.headers.origin;
        if (origin !== undefined && input.request.method === 'OPTIONS')
            return this.preflightResponse(origin);
        input.pipelines.response.push((output) => {
            output.headers ??= new Headers();
            if (origin !== undefined) {
                output.headers.set('access-control-allow-origin', origin);
                output.headers.set('access-control-allow-credentials', 'true');
                output.headers.set('access-control-expose-headers', 'authorization, content-type, content-length, date, etag, last-modified');
            }
            const method = input.request.method;
            if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS')
                output.headers.append('vary', 'origin');
        });
        return null;
    }
    reset() {
        this.requestHeaders = new Set(REQUEST_HEADERS);
        this.headers.set('access-control-allow-headers', this.allowedHeaders());
    }
    allow(header) {
        this.requestHeaders.add(header.toLowerCase());
        this.headers.set('access-control-allow-headers', this.allowedHeaders());
    }
    /**
     * Sorted, because the set is filled as branches merge and their order is not
     * fixed — an unsorted value would differ between otherwise identical processes,
     * and between one restart and the next.
     */
    allowedHeaders() {
        return Array.from(this.requestHeaders).sort().join(', ');
    }
    preflightResponse(origin) {
        this.headers.set('access-control-allow-origin', origin);
        return {
            status: 204,
            headers: this.headers
        };
    }
}
exports.CORS = CORS;
//# sourceMappingURL=CORS.js.map