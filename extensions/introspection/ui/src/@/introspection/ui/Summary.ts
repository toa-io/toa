import type { ClassValue } from 'svelte/elements'
import type { Node } from '@/introspection'

export type Countable = Pick<Node, 'entity' | 'operations' | 'events' | 'receivers'>

export interface Props {
  node: Countable
  class?: ClassValue
}
