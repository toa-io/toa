import { type Stream } from './lib/streams'

export interface Context {
  state: Record<string, Stream>
}

export interface PushInput {
  key: string
  event: string
  data: unknown
}
