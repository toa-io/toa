import { Connector, exceptions, trail } from '@toa.io/core'
import type { Local } from './Local.ts'
import type { Options } from '@toa.io/definitions/extensions.cadence'

interface Input {
  endpoint: string
  interval: number
  overdue: number | null
  request?: object
  trail?: string[]
}

/**
 * `context.delay(endpoint, request, delay)` — a call to be made later, handed to the component
 * that keeps them.
 *
 * It is not transactional with the caller's state. A crash between committing a change and
 * handing over the call it should have scheduled loses the call, and there is no way for this
 * to know. Where the semantics allow it, hand the call over first.
 *
 */
export class Aspect extends Connector {
  public readonly name = 'delay'

  private readonly metronome: Local

  public constructor(metronome: Local) {
    super()

    this.metronome = metronome

    this.depends(metronome)
  }

  // named rather than forwarded, so that the connector's lifecycle is not reachable from an
  // algorithm — the same reason the atom aspect names its own
  public async invoke(method: string, ...args: any[]): Promise<unknown> {
    switch (method) {
      case 'delay':
        return await this.delay(args[0], args[1], args[2])
      case 'cancel':
        return await this.cancel(args[0])
      default:
        throw new Error(`Delay aspect has no '${method}' method`)
    }
  }

  /** Answers the id the call was given, which is what cancels it. */
  private async delay(
    endpoint: string,
    request: object | null,
    options: Options
  ): Promise<unknown> {
    /*
     * A delayed call goes out as a task, and a task is taken by whichever process consumes the
     * queue, which a stateful operation has none of: a delayed call names no process.
     */
    if (request !== null && request !== undefined && 'instance' in request)
      throw new exceptions.RequestContractException('A delayed call names no `instance`')

    const input: Input = {
      endpoint,
      interval: options.interval,
      overdue: options.overdue
    }

    // a call that takes no request carries none, rather than a null one
    if (request !== null && request !== undefined) input.request = request

    /*
     * A delay is a hop, so the chain that asked for the call is stored with it and the call is
     * made by it — otherwise a circle routed through `context.delay` would be one nothing sees.
     * It rides the row rather than the request, because the request is the caller's and a call
     * that carries none must go on carrying none.
     */
    const hops = options.detached === true ? undefined : trail.current()?.hops

    if (hops !== undefined) input.trail = hops

    return await this.metronome.invoke('delay', { input })
  }

  /**
   * Tombstones the row, which is the prototype's `terminate`. An id that was never issued has
   * nothing to terminate and raises; one whose call has already been made has a row still, and
   * terminating it again is not an error.
   */
  private async cancel(id: string): Promise<unknown> {
    return await this.metronome.invoke('terminate', { query: { id }, input: null })
  }
}
