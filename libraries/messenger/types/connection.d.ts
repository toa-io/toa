import * as _channel from './channel'

declare namespace toa.messenger {

  interface Connection {
    connect(): Promise<void>

    in(): Promise<_channel.Channel>

    out(): Promise<_channel.Channel>
  }

}
