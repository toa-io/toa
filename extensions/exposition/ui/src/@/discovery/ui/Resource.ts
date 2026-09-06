import type { ClassValue } from 'svelte/elements'
import type { Resource } from '@/discovery'

export interface Props {
  /** The route template, as the tree keys it: without the slash it is addressed with. */
  route: string
  resource: Resource
  open?: boolean
  class?: ClassValue
}
