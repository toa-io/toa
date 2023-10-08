import { type Duplex } from 'node:stream'

export interface Context {
  state: Record<string, Duplex>
}

export interface PushInput {
  key: string
  event: string
  data: unknown
}
