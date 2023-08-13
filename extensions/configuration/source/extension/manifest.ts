import * as schemas from './schemas'

export function manifest (manifest: Manifest): Manifest {
  schemas.manifest.validate(manifest)

  return manifest
}

export interface Manifest {
  schema: object
  defaults?: object
}
