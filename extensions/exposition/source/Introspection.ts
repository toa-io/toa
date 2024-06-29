import type { Remote } from '@toa.io/core'

export interface Introspection {
  route?: Record<string, Schema>
  query?: Record<string, Schema>
  input?: Schema
  output?: Schema
  errors?: string[]
}

export type Schema = Awaited<ReturnType<Remote['explain']>>['input']
