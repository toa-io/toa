import type { Guard as Bridge } from './types/bridges.js'

export class Guard {
  public readonly name: string

  readonly #bridge: Bridge

  public constructor (name: string, bridge: Bridge) {
    this.name = name
    this.#bridge = bridge
  }

  public fit (state: object, origin: object | null): boolean {
    return this.#bridge.fit(state, origin)
  }
}
