import * as _state from './state'

declare namespace toa.core {

  interface Event {
    emit(event: _state.Event): Promise<void>
  }

}

export type Event = toa.core.Event
