import assert from 'node:assert'
import { setTimeout } from 'node:timers/promises'
import { console } from 'openspan'
import { type bindings, Connector } from '@toa.io/core'
import * as http from './HTTP'
import { rethrow } from './exceptions'
import type { Interception } from './Interception'
import type { Method, Node, Parameter, Tree, Match } from './RTD'
import type { Label } from './discovery'
import type { Branch } from './Branch'

export class Gateway extends Connector {
  private readonly broadcast: Broadcast
  private readonly tree: Tree
  private readonly interceptor: Interception
  private readonly branches = new Map<string, Exposed>()
  private lastMerge = 0
  private lastPing = 0
  private stopped = false
  private resolveFirstMerge: (() => void) | null = null

  public constructor (broadcast: Broadcast, tree: Tree, interception: Interception) {
    super()

    this.broadcast = broadcast
    this.tree = tree
    this.interceptor = interception

    this.depends(broadcast)
  }

  public async process (context: http.Context): Promise<http.OutgoingMessage> {
    const interception = await context.timing.capture('intercept',
      this.interceptor.intercept(context))

    if (interception !== null)
      return interception

    const { node, parameters } = this.match(context)

    if (context.request.method === 'OPTIONS')
      return await this.explain(node, parameters)

    let verb = context.request.method

    if (!(verb in node.methods) && verb === 'HEAD' && 'GET' in node.methods)
      verb = 'GET'

    if (!(verb in node.methods))
      throw new http.MethodNotAllowed()

    const method = node.methods[verb]

    const interruption = await context.timing.capture('preflight',
      method.directives.preflight(context, parameters)).catch(rethrow)

    const response = interruption ??
      await context.timing.capture('call', this.call(method, context, parameters))

    await context.timing.capture('settle',
      method.directives.settle(context, response)).catch(rethrow)

    return response
  }

  protected override async open (): Promise<void> {
    await this.discover()

    console.info('Gateway started')
  }

  protected override dispose (): void {
    this.stopped = true

    this.tree.dispose()

    console.info('Gateway is closed')
  }

  private match (context: http.Context): Match {
    const match = this.tree.match(context.url.pathname)

    if (match === null) {
      // the route may be missing because an expose has been lost
      this.reping()

      throw new http.NotFound('Route not found')
    }

    if (match.node.forward === null)
      return match

    const destination = match.node.forward.replace(/\/:([^/]+)/g,
      (_, name) => {
        const value = match.parameters.find((parameter) => parameter.name === name)?.value

        assert.ok(value !== undefined, `Forwarded parameter '${name}' not found`)

        return `/${value}`
      })

    const forward = this.tree.match(destination)

    assert.ok(forward !== null, 'Forwarded route not found')

    return forward
  }

  private async call (method: Method, context: http.Context, parameters: Parameter[]): Promise<http.OutgoingMessage> {
    if (context.url.pathname[context.url.pathname.length - 1] !== '/')
      throw new http.NotFound('Trailing slash is required')

    if (context.encoder === null)
      throw new http.NotAcceptable()

    if (method.endpoint === null)
      throw new http.MethodNotAllowed()

    return await method.endpoint
      .call(context, parameters)
      .catch(rethrow) as http.OutgoingMessage
  }

  private async explain (node: Node, parameters: Parameter[]): Promise<http.OutgoingMessage> {
    const body = await node.explain(parameters)
    const allow = [...Object.keys(node.methods)].join(', ')
    const headers = new Headers({ allow })

    return { body, headers }
  }

  private async discover (): Promise<void> {
    const first = new Promise<void>((resolve) => {
      this.resolveFirstMerge = resolve
    })

    await this.broadcast.receive<Branch>('expose', this.merge.bind(this))

    void this.knock()

    await this.settled(first)
  }

  /**
   * A single ping is enough only if every tenant is listening by then, which is
   * not the case while the deployment is still rolling out.
   */
  private async knock (): Promise<void> {
    for (const delay of KNOCK_DELAYS) {
      if (this.stopped)
        return

      if (delay > 0)
        await setTimeout(delay, undefined, { ref: false })

      await this.ping()
    }
  }

  private async ping (): Promise<void> {
    if (this.stopped)
      return

    this.lastPing = Date.now()

    await this.broadcast.transmit<null>('ping', null)
      .catch((exception: Error) => console.error('Discovery ping failed',
        { message: exception.message }))
  }

  private reping (): void {
    if (Date.now() - this.lastPing < PING_COOLDOWN)
      return

    void this.ping()
  }

  private async settled (first: Promise<void>): Promise<void> {
    const deadline = Date.now() + SETTLE_TIMEOUT
    const abort = new AbortController()

    // an uncancelled timer keeps the process alive long after the race is won
    await Promise.race([first, setTimeout(SETTLE_TIMEOUT, undefined, { signal: abort.signal })])
      .finally(() => { abort.abort() })
      .catch(() => {})

    if (this.lastMerge === 0) {
      console.warn('Discovery timed out waiting for the first expose')

      return
    }

    while (Date.now() - this.lastMerge < SETTLE_QUIET) {
      if (Date.now() >= deadline)
        break

      await setTimeout(SETTLE_POLL)
    }
  }

  private merge (branch: Branch): void {
    const id = branch.namespace + '.' + branch.component

    const attributes = {
      namespace: branch.namespace,
      component: branch.component,
      version: branch.version
    }

    const exposed = this.branches.get(id)

    // rebuilding an identical branch would only tear down its live endpoints
    if (exposed?.version === branch.version) {
      this.tree.refresh(exposed.nodes)
      console.debug('Branch refreshed', attributes)

      return
    }

    let nodes: Node[]

    try {
      nodes = this.tree.merge(branch.node, branch)
    } catch (exception: unknown) {
      const message = exception instanceof Error ? exception.message : 'Unknown error'

      console.error('Branch merge exception', { message, ...attributes })

      return
    }

    this.branches.set(id, { version: branch.version, nodes })
    this.lastMerge = Date.now()
    this.resolveFirstMerge?.()
    this.resolveFirstMerge = null

    console.info('Branch merged', attributes)
  }
}

export type Broadcast = bindings.Broadcast<Label>

interface Exposed {
  version: string
  nodes: Node[]
}

const SETTLE_QUIET = 10_000
const SETTLE_TIMEOUT = 30_000
const SETTLE_POLL = 50
const KNOCK_DELAYS = [0, 500, 1000, 1500]
const PING_COOLDOWN = 5_000
