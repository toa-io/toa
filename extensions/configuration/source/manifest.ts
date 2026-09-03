import * as schemas from './schemas.js'
import { type Node } from './configuration.js'

export function manifest (manifest: Manifest): Manifest {
  schemas.manifest.validate(manifest)

  return manifest
}

export interface Manifest {
  schema: object
  defaults?: Node
}
