import type { ClassValue } from 'svelte/elements'
import type { Node } from '@/introspection'

type Countable = Pick<Node, 'entity' | 'operations' | 'events' | 'receivers'>

export interface Props {
  node: Countable
  class?: ClassValue
}

export type { Countable }
