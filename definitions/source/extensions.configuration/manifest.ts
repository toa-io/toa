import * as schemas from './schemas.js'

export function manifest(manifest: Manifest): Manifest {
  schemas.manifest.validate(manifest)

  return manifest
}

export interface Manifest {
  schema: object
  defaults?: Record<string, unknown>
}
