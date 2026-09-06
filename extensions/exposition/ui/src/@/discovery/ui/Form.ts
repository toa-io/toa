import type { Field, Values } from './request'

export interface Props {
  fields: Field[]
  /** What has been filled in, held by whoever makes the call. */
  values: Values
  /** The body, where the call carries one. */
  body: string
  /** Whether it carries one at all. */
  carries: boolean
  /** Whether what was typed as the body is not JSON. */
  invalid: boolean
  /** @default false */
  disabled?: boolean
}

/** What a field is called on the page, and what a label points at. */
export function id(key: string): string {
  return `discovery-${key.replace(':', '-')}-input`
}
