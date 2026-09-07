import type { Octets } from '@/discovery'
import type { Field, Values } from './request'

export interface Props {
  fields: Field[]
  /** What has been filled in, held by whoever makes the call. */
  values: Values
  /** The body, where the call carries one. */
  body: string
  /** Whether it carries one at all. */
  carries: boolean
  /** The file to send, where the body is one. */
  file: File | null
  /** What sending a file here takes, where that is what the body is. */
  octets?: Octets
  /** Whether what was typed as the body is not JSON. */
  invalid: boolean
  /** The fields the call cannot be made without, and that are empty. */
  blank: string[]
  /** @default false */
  disabled?: boolean
}

/** What a field is called on the page, and what a label points at. */
export function id(key: string): string {
  return `discovery-${key.replace(':', '-')}-input`
}
