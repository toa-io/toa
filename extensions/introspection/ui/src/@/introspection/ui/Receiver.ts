import type { ClassValue } from 'svelte/elements'
import type { Receiver } from '@/introspection'

export interface Props {
  receiver: Pick<Receiver, 'source' | 'event' | 'operation' | 'conditioned' | 'adaptive'>
  /** Names the line an edge of the map can point at, once the card is opened. */
  row?: string
  class?: ClassValue
}
