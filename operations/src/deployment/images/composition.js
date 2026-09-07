import { join } from 'node:path'

import { Bundle } from './bundle.js'

export class Composition extends Bundle {
  dockerfile = join(import.meta.dirname, 'composition.Dockerfile')

  #name

  constructor(scope, runtime, registry, composition) {
    super(scope, runtime, registry, composition)

    this.#name = composition.name
  }

  get name() {
    return 'composition-' + this.#name
  }

  conflict() {
    return `Composition '${this.#name}' requires different base images for its components. Specify base image for the composition in the context.`
  }
}
