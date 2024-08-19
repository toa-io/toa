import type { Readable } from 'node:stream'

export type Entry = { id: string } & Metadata
export type EntryStream = { stream: Readable } & Entry
export type MetadataStream = { stream: Readable } & Metadata

export interface Metadata {
  type: string
  size: number
  created: string
  attributes: Attributes
}

export type Attributes = Record<string, string>
