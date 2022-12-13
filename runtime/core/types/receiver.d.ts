import * as _message from './message'

declare namespace toa.core {

  interface Receiver {
    receive(message: _message.Message): Promise<void>
  }

}

export type Receiver = toa.core.Receiver
