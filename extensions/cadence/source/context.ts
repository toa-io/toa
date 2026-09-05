import type { Contribution } from '@toa.io/core/types'

/** What this extension puts on the context of a component that declares it. */
export function context (): Contribution {
  return {
    name: 'delay',
    type: 'Delay',
    imports: { '@toa.io/extensions.cadence': ['Delay'] }
  }
}
