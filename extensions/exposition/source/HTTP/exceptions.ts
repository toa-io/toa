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

class MediaTypeException extends ClientError {
  private static readonly message = 'Supported media types:\n- ' + types.join('\n- ')

  protected constructor (status: number) {
    super(status, MediaTypeException.message)
  }
}

export class UnsupportedMediaType extends MediaTypeException {
  public constructor () {
    super(415)
  }
}

export class NotAcceptable extends MediaTypeException {
  public constructor () {
    super(406)
  }
}
