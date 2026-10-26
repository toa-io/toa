import type { ClassValue } from 'svelte/elements'
import type { Event } from '#/introspection/index.js'

export interface Props {
  event: Pick<Event, 'label' | 'binding'>
  /** Names the line an edge of the map can point at, once the card is opened. */
  row?: string
  class?: ClassValue
}
