import * as _state from './state.js'

declare namespace toa.core {

  interface Event {
    emit(event: _state.Event): Promise<void>
  }

}

export type Event = toa.core.Event
