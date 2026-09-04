import type { Manifest } from './manifest.js'
import type { Contribution } from '@toa.io/core'

/** What this extension puts on the context of a component that declares it. */
export function context (declaration: Manifest): Contribution {
  return { name: 'configuration', schema: declaration.schema }
}
