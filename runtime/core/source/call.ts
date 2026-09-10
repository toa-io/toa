import { Readable } from 'node:stream'
import { current, encode } from 'openspan'
import { Connector } from './connector.js'
import { derive, newid } from './entities/newid.js'
import * as trail from './trail.js'
import type { Transmission } from './transmission.js'
import type { Request as Contract } from './contract/request.js'
import type { Envelope, Request, Source } from './types/request.js'

export class Call extends Connector {
  readonly #transmitter: Transmission
  readonly #contract: Contract

  /** what this calls, as a hop is named, so that an identity derived here names it too */
  readonly #target: string

  readonly #source: Source | undefined

  // eslint-disable-next-line max-params
  public constructor(
    transmitter: Transmission,
    contract: Contract,
    target: string,
    source?: Source
  ) {
    super()

    this.#transmitter = transmitter
    this.#contract = contract
    this.#target = target
    this.#source = source

    this.depends(transmitter)
  }

  public async invoke(request: Request = {}): Promise<any> {
    const invocation = trail.current()

    /*
     * The envelope is built around what the caller asked for rather than written over it: one
     * request object is handed to several concurrent calls in more than one place, and those are
     * different calls — sharing one identity would have all but the first refused as duplicates
     * of it.
     */
    const envelope: Envelope = {
      ...request,

      // avoid validation on the recipient's side
      authentic: true,

      // an operation that takes no input still has to send an explicit null
      input: request.input ?? null,

      id: request.id ?? this.#identity(invocation),

      /*
       * What a receiver has already put on the request wins, and a service with no chain in
       * scope starts one under its own name.
       */
      trail: request.trail ?? invocation?.hops ?? service(this.#source),

      // the caller may have attributed the call itself, as the node bridge does
      source: request.source ?? this.#source
    }

    // nothing carries a key it has no value for onto the wire
    if (envelope.source === undefined) delete envelope.source
    if (envelope.trail === undefined) delete envelope.trail

    this.#contract.fit(envelope)

    const context = current()

    if (context !== undefined) envelope.telemetry = encode(context)

    const reply = await this.#transmitter.request(envelope)

    if (reply === null) return null
    else if (reply instanceof Readable) return reply
    else {
      if (reply.exception !== undefined) throw reply.exception

      if (reply.error !== undefined) return new RemoteError(reply.error)
      else return reply.output
    }
  }

  public explain(): any {
    return this.#contract.discovery
  }

  /**
   * Derived where this process is serving a call, so that the same call served twice makes the
   * same call here twice over and whatever it reaches refuses its own copy; minted where there
   * is nothing to derive from, which is an entry point, or a caller from before identities.
   */
  #identity(invocation: trail.Invocation | undefined): string {
    if (invocation?.id === undefined) return newid()

    return derive(invocation.id, this.#target, trail.ordinal(invocation, this.#target))
  }
}

/** Where a service calls from no invocation, the chain starts under the service's own name. */
function service(source: Source | undefined): string[] | undefined {
  return source !== undefined && 'service' in source ? [source.service] : undefined
}

// the remote error as a value: every property it carries, and nothing else enumerable
class RemoteError extends Error {
  public constructor(error: object) {
    super()

    Object.assign(this, error)
  }
}
