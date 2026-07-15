import * as schemas from './schemas'
import { type Node } from './configuration'

export function manifest (manifest: Manifest): Manifest {
  schemas.manifest.validate(manifest)

  return manifest
}

export interface Manifest {
  schema: object
  defaults?: Node
}
