import type { ClassValue } from 'svelte/elements'
import type { Node } from '@/introspection'

export interface Props {
  node: Pick<Node, 'namespace' | 'component' | 'entity' | 'operations' | 'events' | 'receivers'>
  class?: ClassValue
}
