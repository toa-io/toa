import type { ClassValue } from 'svelte/elements'
import type { Operation } from '@/introspection'

type OperationLike = Pick<
  Operation,
  'endpoint' | 'type' | 'scope' | 'input' | 'output' | 'errors'
>

export interface Props {
  operation: OperationLike
  class?: ClassValue
}

export type { OperationLike }
