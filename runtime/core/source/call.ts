import { Readable } from 'node:stream'
import { current, encode } from 'openspan'
import { Connector } from './connector.js'
import type { Transmission } from './transmission.js'
import type { Request as Contract } from './contract/request.js'
import type { Request, Source } from './types/request.js'

export class Call extends Connector {
  readonly #transmitter: Transmission
  readonly #contract: Contract
  readonly #source: Source | undefined

  public constructor (transmitter: Transmission, contract: Contract, source?: Source) {
    super()

    this.#transmitter = transmitter
    this.#contract = contract
    this.#source = source

    this.depends(transmitter)
  }

  public async invoke (request: Request = {}): Promise<any> {
    // the caller may have attributed the call itself, as the node bridge does
    if (this.#source !== undefined)
      request.source ??= this.#source

    // fitting first lets the input schema supply its default;
    // an operation that takes no input still has to send an explicit null
    this.#contract.fit(request)

    request.input ??= null

    // avoid validation on the recipient's side
    request.authentic = true

    const context = current()

    if (context !== undefined)
      request.telemetry = encode(context)

    const reply = await this.#transmitter.request(request)

    if (reply === null) return null
    else if (reply instanceof Readable) return reply
    else {
      if (reply.exception !== undefined)
        throw reply.exception

      if (reply.error !== undefined)
        return new RemoteError(reply.error)
      else
        return reply.output
    }
  }

  public explain (): any {
    return this.#contract.discovery
  }
}



// the remote error as a value: every property it carries, and nothing else enumerable
class RemoteError extends Error {
  public constructor (error: object) {
    super()

    Object.assign(this, error)
  }
}
