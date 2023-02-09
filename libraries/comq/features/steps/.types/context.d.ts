import * as _io from '../../../types'

declare namespace comq.features {

  type Context = {
    io: _io.IO
    reply?: any
    consumed?: Record<string, any>
    published?: any
  }

}
