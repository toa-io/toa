import { console, current, decode, run, type SpanOptions } from 'openspan'
import { Connector } from './connector.js'
import { EndpointException } from './exceptions.js'
import * as trail from './trail.js'
import type { Locator } from './locator.js'
import type { Envelope, Request } from './types/request.js'

/** What a component holds one of per endpoint: an operation, or the call that stands for it. */
export interface Invocable extends Connector {
  invoke: (request: Envelope) => Promise<any>
}

export class Component<O extends Invocable = Invocable> extends Connector {
  public readonly locator: Locator

  protected readonly operations: Record<string, O>

  protected kind: 'server' | 'client' = 'server'

  /** span options per endpoint */
  readonly #spans: Record<string, SpanOptions> = {}

  /** what refuses a call that has been here already, as the environment states it */
  readonly #limits = trail.limits()

  public constructor(locator: Locator, operations: Record<string, O>) {
    super()

    this.locator = locator
    this.operations = operations

    Object.values(operations).forEach((operation) => this.depends(operation))
  }

  public async invoke<T = any>(endpoint: string, request?: Request): Promise<T> {
    if (!(endpoint in this.operations))
      throw new EndpointException(`'${endpoint}' is not provided by '${this.locator.id}'`)

    // if the request carries no telemetry, the trace starts here
    const remote = request?.telemetry === undefined ? null : decode(request.telemetry)

    const invocation = async (): Promise<any> => this.#process(endpoint, request)

    let task = invocation

    /*
     * The hop is the server's alone. A `Remote` is a component too and names the very endpoint
     * this one does, so counting it there as well would make the threshold depend on how many
     * clients a call happened to cross — a different number for a local call, an HTTP one and a
     * delayed one. An endpoint beginning with `.` is the runtime's own and is no hop at all.
     */
    if (this.kind === 'server' && endpoint[0] !== '.') {
      let hops: string[]

      try {
        // the span's name is the hop's, and it is already built once per endpoint
        hops = trail.extend(request?.trail, this.#span(endpoint).name, this.#limits)
      } catch (exception) {
        console.error('Call chain refused', {
          endpoint: `${this.locator.id}.${endpoint}`,
          exception
        })

        // answered, not thrown: thrown, this would run into the broker library on the event
        // path, and on the call path its code would survive only by `Exception` not being an
        // `Error`. Answered, `Call` throws it into the caller as it does any other.
        return { exception } as T
      }

      /*
       * The identity is put in scope with the chain: an operation reaches neither, and the
       * calls it makes derive their own from what it is serving.
       */
      const scope: trail.Invocation = { hops, id: request?.id, calls: new Map() }

      task = async (): Promise<any> => trail.follow(scope, invocation)
    }

    if (remote === null) return task()
    else return run(remote, task)
  }

  async #process(endpoint: string, request?: Request): Promise<any> {
    return console.span(this.#span(endpoint), async () => {
      const reply = await this.operations[endpoint].invoke(request as Envelope)

      if (reply?.exception !== undefined) {
        const span = current()

        if (span !== undefined) span.status = 'error'

        console.error('Failed to execute operation', {
          endpoint: `${this.locator.id}.${endpoint}`,
          exception: reply.exception
        })
      }

      return reply
    })
  }

  /**
   * The span of an endpoint never changes, so it is built once. Not in the constructor:
   * `kind` is a field of the subclass, and those are assigned after this one is built.
   *
   */
  #span(endpoint: string): SpanOptions {
    let options = this.#spans[endpoint]

    if (options === undefined) {
      options = { name: `${this.locator.id}.${endpoint}`, kind: this.kind }

      // the server span is emitted by the component itself, while the client span
      // belongs to the calling service and inherits it from the context
      if (this.kind === 'server') options.service = this.locator.id

      this.#spans[endpoint] = options
    }

    return options
  }
}
