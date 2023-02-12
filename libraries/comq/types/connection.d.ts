import * as _channel from './channel'
import * as _io from './io'

declare namespace comq {

  interface Connection {
    connect(): Promise<void>

    createInputChannel(): Promise<_channel.Channel>

    createOutputChannel(): Promise<_channel.Channel>

    close(): Promise<void>
  }

  type connect = (url: string) => Promise<_io.IO>

}
