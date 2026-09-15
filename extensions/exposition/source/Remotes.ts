import { Locator, Connector, type Contract, type Remote } from '@toa.io/core'
import type { Source } from '@toa.io/core/types'
import { type Host } from './Factory.ts'

export class Remotes extends Connector {
  private readonly host: Host
  private readonly cache: Record<string, Promise<Remote>> = {}

  public constructor(host: Host) {
    super()
    this.host = host
  }

  /**
   * @param contract the component's, as the branch that announced the routes carries it, so that
   *   what a caller is held to is what the routes belong to. Absent — a directive calling a
   *   component on its own behalf — the process's map states it, as it does for any other caller.
   */
  // not `async`: what an async method returns is awaited, and awaiting is what makes the
  // remote, so a route would locate what it reaches as it is made rather than as it is called
  public discover(namespace: string, name: string, contract?: Contract): Promise<Remote> {
    const locator = new Locator(name, namespace)
    const key = locator.id + ':' + (contract?.version ?? 'local')

    this.cache[key] ??= lazily(async () => await this.locate(locator, contract))

    return this.cache[key]
  }

  private async locate(locator: Locator, contract?: Contract): Promise<Remote> {
    // the gateway is the origin of every call it forwards
    const remote = await this.host.remote(locator, SOURCE, contract)

    this.depends(remote)

    await remote.connect()

    return remote
  }
}

const SOURCE: Source = { service: 'exposition' }

/**
 * A promise whose work starts when it is first awaited.
 *
 * A route is made when it is announced and called whenever it is called, and what it reaches is
 * described by the map as it stands at the call: a component composed after the tree was built is
 * one this process states by then, and one nothing states is refused to whoever calls the route
 * rather than to whoever made it.
 */
function lazily<T>(work: () => Promise<T>): Promise<T> {
  let promise: Promise<T> | undefined

  return {
    then: (resolve, reject) => (promise ??= work()).then(resolve, reject)
  } as Promise<T>
}
