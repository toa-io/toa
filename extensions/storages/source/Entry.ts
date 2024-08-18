import type { Readable } from 'node:stream'

export interface Entry {
  stream: Readable
  metadata: Metadata
}

export interface Metadata {
  type: string
  size: number
  created: number
  attributes?: Attributes
}

type Attributes = Record<string, any>
