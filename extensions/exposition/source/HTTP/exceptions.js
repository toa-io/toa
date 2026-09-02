"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceUnavailable = exports.TooManyRequests = exports.UnprocessableEntity = exports.UnsupportedMediaType = exports.RequestEntityTooLarge = exports.PreconditionFailed = exports.Conflict = exports.NotAcceptable = exports.MethodNotAllowed = exports.NotFound = exports.Forbidden = exports.Unauthorized = exports.BadRequest = exports.ClientError = exports.Exception = void 0;
class Exception extends Error {
    status;
    body;
    /** Headers the status is not complete without, like `Retry-After` on a 429. */
    headers;
    constructor(status, body, headers) {
        super();
        this.status = status;
        this.body = body;
        this.headers = headers;
    }
}
exports.Exception = Exception;
class ClientError extends Exception {
}
exports.ClientError = ClientError;
class BadRequest extends ClientError {
    constructor(body) {
        super(400, body);
    }
}
exports.BadRequest = BadRequest;
class Unauthorized extends ClientError {
    constructor(body) {
        super(401, body);
    }
}
exports.Unauthorized = Unauthorized;
class Forbidden extends ClientError {
    constructor(body) {
        super(403, body);
    }
}
exports.Forbidden = Forbidden;
class NotFound extends ClientError {
    constructor(body) {
        super(404, body);
    }
}
exports.NotFound = NotFound;
class MethodNotAllowed extends ClientError {
    constructor() {
        super(405);
    }
}
exports.MethodNotAllowed = MethodNotAllowed;
class NotAcceptable extends ClientError {
    constructor() {
        super(406);
    }
}
exports.NotAcceptable = NotAcceptable;
class Conflict extends ClientError {
    constructor(body) {
        super(409, body);
    }
}
exports.Conflict = Conflict;
class PreconditionFailed extends ClientError {
    constructor() {
        super(412);
    }
}
exports.PreconditionFailed = PreconditionFailed;
class RequestEntityTooLarge extends ClientError {
    constructor(body) {
        super(413, body);
    }
}
exports.RequestEntityTooLarge = RequestEntityTooLarge;
class UnsupportedMediaType extends ClientError {
    constructor() {
        super(415);
    }
}
exports.UnsupportedMediaType = UnsupportedMediaType;
class UnprocessableEntity extends ClientError {
    constructor(body) {
        super(422, body);
    }
}
exports.UnprocessableEntity = UnprocessableEntity;
class TooManyRequests extends ClientError {
    /** @param retry Seconds until the request would be admitted. */
    constructor(retry) {
        super(429, undefined, retry === undefined ? undefined : new Headers({ 'retry-after': String(retry) }));
    }
}
exports.TooManyRequests = TooManyRequests;
class ServiceUnavailable extends Exception {
    constructor(body) {
        super(503, body);
    }
}
exports.ServiceUnavailable = ServiceUnavailable;
//# sourceMappingURL=exceptions.js.map