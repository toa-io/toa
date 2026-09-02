export declare class Exception extends Error {
    readonly status: number;
    readonly body?: any;
    /** Headers the status is not complete without, like `Retry-After` on a 429. */
    readonly headers?: Headers;
    protected constructor(status: number, body?: any, headers?: Headers);
}
export declare class ClientError extends Exception {
}
export declare class BadRequest extends ClientError {
    constructor(body?: any);
}
export declare class Unauthorized extends ClientError {
    constructor(body?: any);
}
export declare class Forbidden extends ClientError {
    constructor(body?: any);
}
export declare class NotFound extends ClientError {
    constructor(body?: any);
}
export declare class MethodNotAllowed extends ClientError {
    constructor();
}
export declare class NotAcceptable extends ClientError {
    constructor();
}
export declare class Conflict extends ClientError {
    constructor(body?: any);
}
export declare class PreconditionFailed extends ClientError {
    constructor();
}
export declare class RequestEntityTooLarge extends ClientError {
    constructor(body?: any);
}
export declare class UnsupportedMediaType extends ClientError {
    constructor();
}
export declare class UnprocessableEntity extends ClientError {
    constructor(body?: any);
}
export declare class TooManyRequests extends ClientError {
    /** @param retry Seconds until the request would be admitted. */
    constructor(retry?: number);
}
export declare class ServiceUnavailable extends Exception {
    constructor(body?: any);
}
