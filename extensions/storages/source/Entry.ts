import type { Readable } from 'node:stream'

export type Stream = { stream: Readable } & Metadata

export type Entry = { id: string } & Metadata

export interface Metadata {
  type: string
  size: number
  created: string
  attributes: Attributes
}

export type Attributes = Record<string, string>
