import { Connector } from './connector.js'
import type { Locator } from './locator.js'

interface Manifest {
  namespace: string
  name: string
  entity?: object
  operations?: object
  events?: object
}

export class Exposition extends Connector {
  public readonly locator: Locator

  readonly #exposition: Partial<Manifest>

  public constructor (locator: Locator, manifest: Manifest) {
    super()

    this.locator = locator
    this.#exposition = expose(manifest)
  }

  public async invoke (): Promise<{ output: Partial<Manifest> }> {
    return { output: this.#exposition }
  }
}

function expose (manifest: Manifest): Partial<Manifest> {
  const { namespace, name, entity, operations, events } = manifest

  return { namespace, name, entity, operations, events }
}
