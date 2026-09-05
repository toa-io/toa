import { Connector } from './connector.js'
import type { Locator } from './locator.js'
import type { Component } from './component.js'
import type { Remote } from './remote.js'
import type { Aspect } from './types/extensions.js'
import type { Request } from './types/request.js'

type Discover = (namespace: string, name: string) => Promise<Remote>

export class Context extends Connector {
  public readonly env: string | undefined
  public readonly name: string | undefined
  public readonly aspects: Aspect[]
  public readonly locator: Locator

  readonly #local: Component
  readonly #discover: Discover
  readonly #remotes: Record<string, Promise<Remote>> = {}

  public constructor (local: Component, discover: Discover, aspects: Aspect[] = []) {
    super()

    this.env = process.env.TOA_ENV
    this.name = process.env.TOA_CONTEXT
    this.aspects = aspects
    this.locator = local?.locator

    this.#local = local
    this.#discover = discover

    this.depends(local)

    if (aspects.length > 0) this.depends(aspects)
  }

  public async apply (endpoint: string, request: Request): Promise<any> {
    return this.#local.invoke(endpoint, request)
  }

  // eslint-disable-next-line max-params
  public async call (namespace: string, name: string, endpoint: string,
    request: Request): Promise<any> {
    const remote = await this.#remote(namespace, name)

    return remote.invoke(endpoint, request)
  }

  async #remote (namespace: string, name: string): Promise<Remote> {
    const key = namespace + '.' + name

    this.#remotes[key] ??= this.#connect(namespace, name)

    return this.#remotes[key]
  }

  async #connect (namespace: string, name: string): Promise<Remote> {
    const remote = await this.#discover(namespace, name)

    this.depends(remote)

    return remote
  }
}
