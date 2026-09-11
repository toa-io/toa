import { Connector } from './connector.js'
import { instance } from './instance.js'
import { environment } from '@toa.io/generic'
import type { Locator } from './locator.js'
import type { Component } from './component.js'
import type { Remote } from './remote.js'
import type { Aspect } from './types/extensions.js'
import type { Options, Request } from './types/request.js'

type Discover = (namespace: string, name: string) => Promise<Remote>

export class Context extends Connector {
  public readonly env: string | undefined
  public readonly name: string | undefined

  /**
   * The rank of the region this deployment is, which is what its writes are stamped with. A
   * deployment that is no region at all reads as zero, which is what its records carry.
   */
  public readonly region: number

  public readonly aspects: Aspect[]
  public readonly locator: Locator

  /** The name this process answers addressed calls under. */
  public readonly instance: string

  readonly #local: Component
  readonly #discover: Discover
  readonly #remotes: Record<string, Promise<Remote>> = {}

  public constructor(local: Component, discover: Discover, aspects: Aspect[] = []) {
    super()

    this.env = environment.get('TOA_ENV')
    this.name = environment.get('TOA_CONTEXT')
    this.region = Number(environment.get('TOA_REGION') ?? 0)
    this.aspects = aspects
    this.locator = local?.locator
    this.instance = instance()

    this.#local = local
    this.#discover = discover

    this.depends(local)

    if (aspects.length > 0) this.depends(aspects)
  }

  public async apply(endpoint: string, request: Request, options?: Options): Promise<any> {
    return this.#local.invoke(endpoint, request, options)
  }

  // eslint-disable-next-line max-params
  public async call(
    namespace: string,
    name: string,
    endpoint: string,
    request: Request,
    options?: Options
  ): Promise<any> {
    const remote = await this.#remote(namespace, name)

    return remote.invoke(endpoint, request, options)
  }

  async #remote(namespace: string, name: string): Promise<Remote> {
    const key = namespace + '.' + name

    this.#remotes[key] ??= this.#connect(namespace, name)

    return this.#remotes[key]
  }

  async #connect(namespace: string, name: string): Promise<Remote> {
    const remote = await this.#discover(namespace, name)

    this.depends(remote)

    return remote
  }
}
