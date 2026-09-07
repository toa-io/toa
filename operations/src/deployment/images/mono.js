import { join } from 'node:path'

import { Bundle } from './bundle.js'

export class Mono extends Bundle {
  dockerfile = join(import.meta.dirname, 'mono.Dockerfile')

  get name() {
    return 'mono'
  }

  conflict() {
    return 'Mono deployment requires different base images for its components. Specify base image for the composition in the context.'
  }
}
