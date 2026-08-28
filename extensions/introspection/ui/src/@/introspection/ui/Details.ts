import type { ClassValue } from 'svelte/elements'
import type { Node } from '@/introspection'

type NodeDetails = Pick<
  Node,
  'version' | 'entity' | 'operations' | 'events' | 'receivers' | 'extensions'
>

export interface Props {
  node: NodeDetails
  class?: ClassValue
}

export type { NodeDetails }
