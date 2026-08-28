import type { ClassValue } from 'svelte/elements'
import type { Event } from '@/introspection'

export interface Props {
  event: Pick<Event, 'label' | 'binding'>
  class?: ClassValue
}
