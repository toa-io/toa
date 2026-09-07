import type { Contribution } from '@toa.io/core/types'

/**
 * What this extension puts on the context of a component that declares it. What a component
 * keeps there is its own, and nothing declares it.
 */
export function context(): Contribution {
  return { name: 'state', type: 'Record<string, any>' }
}
