/** What marks an `Encoded` in every copy of this package, which its class does not: see `is`. */
const KEY = Symbol.for('toa.core.encoded')

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

    Object.defineProperty(this, KEY, { value: true })
  }

  /**
   * Whether a value is an `Encoded`, whichever copy of this package made it. A process may load
   * the package more than once — the gateway image installs it beside the runtime and again beside
   * the extension — and what one copy made is no instance of the other copy's class.
   */
  public static is(value: unknown): value is Encoded {
    return typeof value === 'object' && value !== null && KEY in value
  }
}
