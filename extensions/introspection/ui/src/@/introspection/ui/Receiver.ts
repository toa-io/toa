import type { ClassValue } from 'svelte/elements'
import type { Receiver } from '@/introspection'

export interface Props {
  receiver: Pick<Receiver, 'source' | 'event' | 'operation' | 'conditioned' | 'adaptive'>
  class?: ClassValue
}
