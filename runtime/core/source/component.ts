import assert from 'node:assert'
import { console, current, decode, run, type SpanOptions } from 'openspan'
import { Connector } from './connector.js'
import type { Locator } from './locator.js'
import type { Request } from './types/request.js'

/** What a component holds one of per endpoint: an operation, or the call that stands for it. */
export interface Invocable extends Connector {
  invoke: (request: Request) => Promise<any>
}

export class Component<O extends Invocable = Invocable> extends Connector {
  public readonly locator: Locator

  protected readonly operations: Record<string, O>

  protected kind: 'server' | 'client' = 'server'

  /** span options per endpoint */
  readonly #spans: Record<string, SpanOptions> = {}

  public constructor (locator: Locator, operations: Record<string, O>) {
    super()

    this.locator = locator
    this.operations = operations

    Object.values(operations).forEach((operation) => this.depends(operation))
  }

  public async invoke<T = any> (endpoint: string, request?: Request): Promise<T> {
    if (!(endpoint in this.operations))
      // `assert.fail`, not `assert.ok`: the message is built only when it is needed
      assert.fail(`Endpoint '${endpoint}' is not provided by '${this.locator.id}'`)

    // if the request carries no telemetry, the trace starts here
    const remote = request?.telemetry === undefined ? null : decode(request.telemetry)
    const task = async (): Promise<any> => this.#process(endpoint, request)

    if (remote === null)
      return task()
    else
      return run(remote, task)
  }

  async #process (endpoint: string, request?: Request): Promise<any> {
    return console.span(this.#span(endpoint), async () => {
      const reply = await this.operations[endpoint].invoke(request as Request)

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
  #span (endpoint: string): SpanOptions {
    let options = this.#spans[endpoint]

    if (options === undefined) {
      options = { name: `${this.locator.id}.${endpoint}`, kind: this.kind }

      // the server span is emitted by the component itself, while the client span
      // belongs to the calling service and inherits it from the context
      if (this.kind === 'server')
        options.service = this.locator.id

      this.#spans[endpoint] = options
    }

    return options
  }
}
