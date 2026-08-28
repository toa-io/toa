import type { ClassValue } from 'svelte/elements'
import type { Snippet } from 'svelte'

export interface Props {
  title: string
  children: Snippet
  class?: ClassValue
}
