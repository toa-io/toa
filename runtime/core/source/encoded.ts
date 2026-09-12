/**
 * An output a component encoded, which its caller passes on as it is: the bytes of what the
 * operation answered, and what they are encoded in. A caller that writes them somewhere — the
 * gateway writing a response body — spends nothing on reading them.
 */
export class Encoded {
  public readonly bytes: Buffer
  public readonly type: string

  public constructor(bytes: Buffer, type: string = 'application/json') {
    this.bytes = bytes
    this.type = type
  }
}
