import type { ClassValue } from 'svelte/elements'
import type { Method } from '@/discovery'

export interface Props {
  /** The route template it is served at, which is what a call is made against. */
  route: string
  verb: string
  of: Method
  open?: boolean
  class?: ClassValue
}
