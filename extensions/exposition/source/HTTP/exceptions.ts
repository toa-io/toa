import { types } from './formats'

export class Exception extends Error {
  public readonly status: number

  protected constructor (status: number, message?: string) {
    super(message)

    this.status = status
  }
}

export class ClientError extends Exception {
}

export class BadRequest extends ClientError {
  public constructor (message?: string) {
    super(400, message)
  }
}

export class Unauthorized extends ClientError {
  public constructor (message?: string) {
    super(401, message)
  }
}

export class Forbidden extends ClientError {
  public constructor (message?: string) {
    super(403, message)
  }
}

export class NotFound extends ClientError {
  public constructor (message?: string) {
    super(404, message)
  }
}

export class MethodNotAllowed extends ClientError {
  public constructor () {
    super(405)
  }
}

class MediaTypeException extends ClientError {
  private static readonly message = 'Supported media types:\n- ' + types.join('\n- ')

  protected constructor (status: number) {
    super(status, MediaTypeException.message)
  }
}

export class NotAcceptable extends MediaTypeException {
  public constructor () {
    super(406)
  }
}

export class UnsupportedMediaType extends MediaTypeException {
  public constructor () {
    super(415)
  }
}

export class PreconditionFailed extends ClientError {
  public constructor () {
    super(412)
  }
}
