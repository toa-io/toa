import { type Readable } from 'node:stream'

export interface Provider {
  get: (path: string) => Promise<Readable | null>
  put: (path: string, filename: string, stream: Readable) => Promise<void>
  delete: (path: string) => Promise<void>
  move: (from: string, to: string) => Promise<void>
}
