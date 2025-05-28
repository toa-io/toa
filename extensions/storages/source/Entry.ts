import type { Readable } from 'node:stream'

export type Entry = { id: string } & Metadata
export type Stream = { stream: Readable } & Metadata

export interface Metadata {
  type: string
  size: number | null
  checksum: string
  created: string
  attributes: Attributes
  range?: string
}

export type Attributes = Record<string, string>
