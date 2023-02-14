import * as _io from '../../../types'

declare namespace comq.features {

  interface Context {
    url?: string
    io?: _io.IO
    reply?: any
    consumed?: Record<string, any>
    published?: any
    events?: { [K in _io.event]?: boolean }
    exception?: Error

    connect(url: string): Promise<void>
  }

}
