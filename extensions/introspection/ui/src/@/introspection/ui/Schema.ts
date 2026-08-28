import type { ClassValue } from 'svelte/elements'

export interface Props {
  label: string
  /** Anything the map carries as-is: a JSON schema, a list of errors. */
  value: unknown
  /** Opened from the outside where whatever holds it is worth reading straight away. */
  open?: boolean
  class?: ClassValue
}
