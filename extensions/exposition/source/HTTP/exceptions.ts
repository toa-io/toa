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

export class UnsupportedMediaType extends ClientError {
  public constructor () {
    super(415)
  }
}

export class NotAcceptable extends ClientError {
  public constructor () {
    super(406)
  }
}
