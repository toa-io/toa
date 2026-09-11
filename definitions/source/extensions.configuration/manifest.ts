import * as schemas from './schemas.ts'

export function manifest(manifest: Manifest): Manifest {
  schemas.manifest.validate(manifest)

  return manifest
}

export interface Manifest {
  schema: object
  defaults?: Record<string, unknown>
}
