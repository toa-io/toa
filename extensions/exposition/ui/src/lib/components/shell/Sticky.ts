import type { ClassValue } from 'svelte/elements'
import type { Snippet } from 'svelte'

export interface Props {
  direction?: 'bottom' | 'top'
  children: Snippet
  class?: ClassValue
}
