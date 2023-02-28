import * as _channel from './channel'
import * as _io from './io'
import * as _diagnostics from './diagnostic'

declare namespace comq {

  interface Connection {
    open(): Promise<void>

    close(): Promise<void>

    createInputChannel(): Promise<_channel.Channel>

    createOutputChannel(): Promise<_channel.Channel>

    diagnose(event: _diagnostics.event, listener: Function): void
  }

  type connect = (url: string) => Promise<_io.IO>

}
