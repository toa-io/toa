export class Exception extends Error {
  public readonly status: number
  public readonly body?: any

  /** Headers the status is not complete without, like `Retry-After` on a 429. */
  public readonly headers?: Headers

  protected constructor (status: number, body?: any, headers?: Headers) {
    super()
    this.status = status
    this.body = body
    this.headers = headers
  }
}

export class ClientError extends Exception {
}

export class BadRequest extends ClientError {
  public constructor (body?: any) {
    super(400, body)
  }
}

export class Unauthorized extends ClientError {
  public constructor (body?: any) {
    super(401, body)
  }
}

export class Forbidden extends ClientError {
  public constructor (body?: any) {
    super(403, body)
  }
}

export class NotFound extends ClientError {
  public constructor (body?: any) {
    super(404, body)
  }
}

export class MethodNotAllowed extends ClientError {
  public constructor () {
    super(405)
  }
}

export class NotAcceptable extends ClientError {
  public constructor () {
    super(406)
  }
}

export class Conflict extends ClientError {
  public constructor (body?: any) {
    super(409, body)
  }
}

export class PreconditionFailed extends ClientError {
  public constructor () {
    super(412)
  }
}

export class RequestEntityTooLarge extends ClientError {
  public constructor (body?: any) {
    super(413, body)
  }
}

export class UnsupportedMediaType extends ClientError {
  public constructor () {
    super(415)
  }
}

export class UnprocessableEntity extends ClientError {
  public constructor (body?: any) {
    super(422, body)
  }
}

export class TooManyRequests extends ClientError {
  /** @param retry Seconds until the request would be admitted. */
  public constructor (retry?: number) {
    super(429, undefined,
      retry === undefined ? undefined : new Headers({ 'retry-after': String(retry) }))
  }
}

export class ServiceUnavailable extends Exception {
  public constructor (body?: any) {
    super(503, body)
  }
}
