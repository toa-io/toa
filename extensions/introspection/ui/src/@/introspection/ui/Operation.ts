import type { ClassValue } from 'svelte/elements'
import type { Operation } from '@/introspection'

type OperationLike = Pick<
  Operation,
  'endpoint' | 'type' | 'scope' | 'input' | 'output' | 'errors'
>

export interface Props {
  operation: OperationLike
  /** Names the line an edge of the map can point at, once the card is opened. */
  row?: string
  class?: ClassValue
}

export type { OperationLike }
