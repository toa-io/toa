class Exception extends Error {
  public readonly status: number

  protected constructor (status: number, message?: string) {
    super(message)

    this.status = status
  }
}

export class BadRequest extends Exception {
  public constructor (message?: string) {
    super(400, message)
  }
}

export class UnsupportedMediaType extends Exception {
  public constructor () {
    super(415)
  }
}

export class NotAcceptable extends Exception {
  public constructor () {
    super(406)
  }
}
