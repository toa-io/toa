import * as schemas from './schemas.ts'
import type { Declaration } from './types.ts'
import type { Manifest } from '@toa.io/norm'

/**
 * The `continuity:` block of a component manifest. Norm hands over the whole manifest, so what
 * the declaration names is checked here rather than left to fail at boot.
 *
 * Only an effect: a transition or an assignment commits state computed from an entity that moves
 * between attempts, and an answer given back beside a moved entity is a state nobody produced.
 */
export function manifest(
  declaration: Declaration | null | undefined,
  component: Manifest
): Declaration {
  schemas.declaration.validate<Declaration>(
    declaration ?? null,
    'Invalid continuity declaration'
  )

  for (const endpoint of Object.keys(declaration!)) {
    const operation = component.operations?.[endpoint]

    if (operation === undefined)
      throw new Error(`Continuity refers to undefined operation '${endpoint}'`)

    if (operation.type !== 'effect')
      throw new Error(
        `Continuity refers to '${endpoint}', and '${endpoint}' is not an effect`
      )
  }

  return declaration!
}
