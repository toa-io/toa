import { type Stream } from './Stream.js'
import { type Stash } from './Stash.js'

export interface Context {
  stash: any
  state: {
    streams: Map<string, Stream>
    stash: Stash
  }
  logs: {
    info: (m: string, att?: object) => void
    error: (m: string, att?: object) => void
  }
  configuration: {
    maxlen: number
    expire: number
  }
}

export interface PushInput {
  key: string
  event: string
  data: unknown
}
