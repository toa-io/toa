import type { Contribution } from '@toa.io/core'

/** What this extension puts on the context of a component that declares it. */
export function context (): Contribution {
  return {
    name: 'stash',
    type: 'Stash',
    imports: { '@toa.io/extensions.stash': ['Stash'] }
  }
}
