import * as schemas from './schemas.ts'
import type { Declaration, Declared } from './types.ts'
import type { Manifest } from '@toa.io/norm'

/**
 * The `chronicles:` block of a component manifest: the events whose renderings are the log's
 * record of the component's changes. Norm hands over the whole manifest, prototype events
 * included, so a label is checked here rather than left to fail at boot.
 *
 * `chronicles: ~` and `chronicles: []` are a component that only sends; it has to produce a
 * value or norm rejects the extension.
 */
export function manifest(
  declaration: Declared | undefined,
  component: Manifest
): Declaration {
  const labels = declaration ?? []

  schemas.declaration.validate<Declaration>(labels, 'Invalid chronicles declaration')

  for (const label of labels)
    if (component.events?.[label] === undefined)
      throw new Error(
        `Chronicles of '${id(component)}' name '${label}', which is not an event of the component.`
      )

  return labels
}

function id(component: Manifest): string {
  return component.namespace === undefined || component.namespace === 'default'
    ? component.name
    : `${component.namespace}.${component.name}`
}
