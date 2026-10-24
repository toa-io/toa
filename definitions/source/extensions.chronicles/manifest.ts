import * as schemas from './schemas.ts'
import type { Declaration, Declared } from './types.ts'
import type { Manifest } from '@toa.io/norm'

/**
 * The `chronicles:` block of a component manifest: the events whose renderings are rows of the
 * log, and the one whose payload is the entity as it stands. Norm hands over the whole manifest,
 * prototype events included, so a label is checked here rather than left to fail at boot.
 *
 * A list is the `events` alone, and `chronicles: ~` and `chronicles: []` a component that only
 * sends; it has to produce a value or norm rejects the extension.
 */
export function manifest(
  declared: Declared | undefined,
  component: Manifest
): Declaration {
  const declaration = normalize(declared)

  schemas.declaration.validate<Declaration>(declaration, 'Invalid chronicles declaration')

  const labels =
    declaration.state === undefined
      ? declaration.events
      : [...declaration.events, declaration.state]

  for (const label of labels)
    if (component.events?.[label] === undefined)
      throw new Error(
        `Chronicles of '${id(component)}' name '${label}', which is not an event of the component.`
      )

  return declaration
}

function normalize(declared: Declared | undefined): Declaration {
  if (declared === null || declared === undefined) return { events: [] }
  if (Array.isArray(declared)) return { events: declared }

  return { ...declared, events: declared.events ?? [] }
}

function id(component: Manifest): string {
  return component.namespace === undefined || component.namespace === 'default'
    ? component.name
    : `${component.namespace}.${component.name}`
}
