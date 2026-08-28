import type { ClassValue } from 'svelte/elements'

export interface Props {
  /** The vertex the map is about, or null for the whole of it. Comes from the address. */
  focus?: string | null
  class?: ClassValue
}
