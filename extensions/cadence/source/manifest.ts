import * as schemas from './schemas.js'
import type { Declaration } from './types.js'
import type { Manifest } from '@toa.io/norm'

/**
 * The `cadence:` block of a component manifest: the operations called on a cadence, by the
 * operation each one calls. Norm hands over the whole manifest, so what the declaration refers
 * to is checked here rather than left to fail at boot.
 *
 * A component that declares nothing still has a declaration. `cadence: ~` is how one that only
 * delays calls says so, and it has to produce a value or norm rejects the extension.
 */
export function manifest (declaration: Declaration | null | undefined,
  component: Manifest): Declaration {
  const normalized: Record<string, unknown> = expand(declaration)

  // `intervals` is defaulted by the schema, so the declaration is only whole after this
  schemas.declaration.validate<Declaration>(normalized, 'Invalid cadence declaration')

  for (const [endpoint, pulse] of Object.entries(normalized)) {
    const operation = component.operations?.[endpoint]

    if (operation === undefined)
      throw new Error(`Pulse refers to undefined operation '${endpoint}'`)

    if (!TYPES.has(operation.type))
      throw new Error(`Pulse '${endpoint}' must refer to an operation of the allowed types: ` +
        [...TYPES].join(', '))

    if (pulse.intervals > pulse.cycle)
      throw new Error(`Pulse '${endpoint}' splits a cycle of ${pulse.cycle} seconds into ` +
        `${pulse.intervals} intervals, which is less than a second each`)
  }

  return normalized
}

/** A pulse whose cycle is not split has nothing to state but the cycle. */
function expand (declaration: Declaration | null | undefined): Record<string, unknown> {
  if (declaration === null || declaration === undefined) return {}

  return Object.fromEntries(Object.entries(declaration)
    .map(([endpoint, pulse]) =>
      [endpoint, typeof pulse === 'number' ? { cycle: pulse } : pulse]))
}

/**
 * The types a receiver may refer to. An operation that produces no side effects has nothing to
 * be called periodically for.
 */
const TYPES = new Set(['transition', 'assignment', 'effect', 'unmanaged'])
