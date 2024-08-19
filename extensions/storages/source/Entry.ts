import type { Readable } from 'node:stream'

export type Entry = { id: string } & Metadata
export type Stream = { stream: Readable } & Metadata

export interface Metadata {
  type: string
  size: number
  checksum: string
  created: string
  attributes: Attributes
}

export type Attributes = Record<string, string>
