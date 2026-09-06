import type { ClassValue } from 'svelte/elements'

export interface Props {
  label: string
  /** Anything the map carries as-is: a JSON schema, a list of errors, a reply. */
  value: unknown
  /**
   * What the value is, and so how it is read: what a thing may be, or what one is.
   * @default 'schema'
   */
  kind?: 'schema' | 'value'
  /** Opened from the outside where whatever holds it is worth reading straight away. */
  open?: boolean
  class?: ClassValue
}
