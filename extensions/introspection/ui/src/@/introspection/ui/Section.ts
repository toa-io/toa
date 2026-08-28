import type { ClassValue } from 'svelte/elements'
import type { Snippet } from 'svelte'

export interface Props {
  title: string
  /** Folded away behind its own heading, and left folded until it is asked for. */
  collapsible?: boolean
  children: Snippet
  class?: ClassValue
}
