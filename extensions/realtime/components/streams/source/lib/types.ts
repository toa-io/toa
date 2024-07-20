import { type Stream } from './Stream'

export interface Context {
  state: {
    streams: Map<string, Stream>
  }
  logs: {
    info: (m: string, att?: object) => void
  }
}

export interface PushInput {
  key: string
  event: string
  data: unknown
}
