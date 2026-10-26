import type { ClassValue } from 'svelte/elements'
import type { Schema } from '#/discovery/index.js'

export interface Props {
  /** What the group is: `route` or `query`. */
  label: string
  of: Record<string, Schema>
  class?: ClassValue
}
