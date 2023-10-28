import { type Stream } from './lib/stream'

export interface Context {
  state: {
    streams: Map<string, Stream>
  }
}

export interface PushInput {
  key: string
  event: string
  data: unknown
}
