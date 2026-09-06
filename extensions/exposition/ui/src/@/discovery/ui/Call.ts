import type { ClassValue } from 'svelte/elements'
import type { Method } from '@/discovery'

export interface Props {
  /** The route template, as the tree keys it. */
  route: string
  verb: string
  of: Method
  class?: ClassValue
}

/**
 * What the badge turns into under the cursor: what the call is, said in a colour. The
 * classes are the `default` and `destructive` badge variants — a variant cannot be
 * declared for a state, so what it is, is written out here.
 */
export const HOVER = 'hover:bg-primary hover:text-primary-foreground'

export const DESTRUCTIVE =
  'hover:bg-destructive/15 hover:text-destructive dark:hover:bg-destructive/25'

/** The one verb that undoes something, and is asked for twice. */
export const DESTRUCTIVELY = 'DELETE'
