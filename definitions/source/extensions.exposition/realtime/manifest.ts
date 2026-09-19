import * as schemas from '../schemas.ts'
import type { Declaration } from './routes.ts'
import type { Manifest } from '@toa.io/norm'

/**
 * A component's routes, refused where one does not say what it exposes: an event is given to its
 * streams only as far as its route names.
 */
export function manifest(declaration: unknown, manifest: Manifest): Declaration {
  schemas.routes.validate(
    declaration,
    `Realtime routes of '${manifest.namespace}.${manifest.name}' are invalid`
  )

  return declaration as Declaration
}
