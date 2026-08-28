import type { ClassValue } from 'svelte/elements'

export interface Props {
  label: string
  /** Anything the map carries as-is: a JSON schema, a list of errors. */
  value: unknown
  class?: ClassValue
}
