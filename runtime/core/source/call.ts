import { Readable } from 'node:stream'
import { current, encode } from 'openspan'
import { Connector } from './connector.ts'
import { derive, newid } from './entities/newid.ts'
import { RequestContractException } from './exceptions.ts'
import { abandoned, waiting } from './abandon.ts'
import * as addressed from './instance.ts'
import * as trail from './trail.ts'
import type { Transmission } from './transmission.ts'
import type { Request as Contract } from './contract/request.ts'
import type { Terms } from './types/bindings.ts'
import type { Envelope, Options, Request, Source } from './types/request.ts'

export class Call extends Connector {
  readonly #transmitter: Transmission
  readonly #contract: Contract

  /** what this calls, as a hop is named, so that an identity derived here names it too */
  readonly #target: string

  readonly #source: Source | undefined

  /** whether a call to it names the process it goes to */
  readonly #stateful: boolean

  // eslint-disable-next-line max-params
  public constructor(
    transmitter: Transmission,
    contract: Contract,
    target: string,
    source?: Source,
    stateful: boolean = false
  ) {
    super()

    this.#transmitter = transmitter
    this.#contract = contract
    this.#target = target
    this.#source = source
    this.#stateful = stateful

    this.depends(transmitter)
  }

  public async invoke(request: Request = {}, options: Options = {}): Promise<any> {
    const invocation = trail.current()

    this.#refuse(request, options)

    // the process a call goes to, which the transmission is handed beside what the call asks
    const { instance, ...asked } = request

    /*
     * The envelope is built around what the caller asked for rather than written over it: one
     * request object is handed to several concurrent calls in more than one place, and those are
     * different calls — sharing one identity would have all but the first refused as duplicates
     * of it.
     */
    const envelope: Envelope = {
      ...asked,

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

    const reply = await this.#transmit(envelope, this.#terms(instance, options.timeout, options.signal))

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

  /** A call whose making contradicts what it calls is refused before anything is sent. */
  #refuse(request: Request, options: Options): void {
    const { instance, task } = request
    const { timeout, signal } = options

    if (this.#stateful && instance === undefined)
      throw new RequestContractException(
        `'${this.#target}' is stateful, and a call to it names \`instance\``
      )

    if (!this.#stateful && instance !== undefined)
      throw new RequestContractException(
        `'${this.#target}' is stateless, and a call to it names no \`instance\``
      )

    // nobody waits for a task, and it is made from wherever the queue is consumed
    if (task === true && (timeout !== undefined || signal !== undefined))
      throw new RequestContractException('A task names no `timeout` and no `signal`')

    if (timeout !== undefined && !(Number.isFinite(timeout) && timeout > 0))
      throw new RequestContractException('`timeout` is a positive number of milliseconds')
  }

  /**
   * What the transmission is handed beside the envelope. An addressed call always waits for a set
   * time — its caller's, or the context's — because nothing else ends a call to a process that has
   * gone; an ordinary call waits for one only where its caller set it.
   */
  #terms(instance?: string, timeout?: number, signal?: AbortSignal): Terms | undefined {
    const deadline = timeout ?? (this.#stateful ? addressed.timeout() : undefined)

    if (instance === undefined && deadline === undefined && signal === undefined)
      return undefined

    const signals: AbortSignal[] = []

    if (signal !== undefined) signals.push(signal)
    if (deadline !== undefined) signals.push(AbortSignal.timeout(deadline))

    const terms: Terms = {}

    if (instance !== undefined) terms.instance = instance
    if (deadline !== undefined) terms.timeout = deadline

    if (signals.length > 0)
      terms.signal = signals.length === 1 ? signals[0] : AbortSignal.any(signals)

    return terms
  }

  /** The reply, or *abandoned* once the caller has stopped waiting, however the wait ended. */
  async #transmit(envelope: Envelope, terms: Terms | undefined): Promise<any> {
    const signal = terms?.signal

    // a call its caller stopped waiting for before it was made is handed to no binding
    if (signal?.aborted === true) throw abandoned(this.#target, signal)

    return await waiting(this.#transmitter.request(envelope, terms), signal, this.#target)
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
