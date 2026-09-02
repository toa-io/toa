import type { ClassValue } from 'svelte/elements'
import type { Node } from '@/introspection'

type NodeDetails = Pick<
  Node,
  | 'namespace'
  | 'component'
  | 'version'
  | 'entity'
  | 'operations'
  | 'events'
  | 'receivers'
  | 'extensions'
>

/** The extension that gives a component configuration, and a page to read it on. */
export const CONFIGURATION = '@toa.io/extensions.configuration'

export interface Props {
  node: NodeDetails
  class?: ClassValue
}

export type { NodeDetails }
