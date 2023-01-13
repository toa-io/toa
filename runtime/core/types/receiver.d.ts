import * as _message from './message'
import * as _connector from './connector'

declare namespace toa.core {

  interface Receiver extends _connector.Connector {
    receive(message: _message.Message | Object): Promise<void>
  }

}

export type Receiver = toa.core.Receiver
