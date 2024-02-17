import * as _core from '@toa.io/core'
import * as _message from './message'

declare namespace toa.sampling{

  interface Receiver extends _core.Receiver{
    receive (message: _message.Message): Promise<void>
  }

}
