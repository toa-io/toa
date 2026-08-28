import type { Writable } from 'svelte/store'
import type { ClassValue } from 'svelte/elements'
import type { Snippet } from 'svelte'

export interface Props {
  children: Snippet
  class?: ClassValue
  active?: Writable<boolean>
}

export interface Action {
  id: string
  snippet: Snippet
  class?: ClassValue
  active?: Writable<boolean>
}
