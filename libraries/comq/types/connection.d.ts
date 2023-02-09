import * as _channel from './channel'
import * as _io from './io'

declare namespace comq {

  interface Connection {
    connect(): Promise<void>

    in(): Promise<_channel.Channel>

    out(): Promise<_channel.Channel>

    close(): Promise<void>
  }

  type connect = (url: string) => Promise<_io.IO>

}
