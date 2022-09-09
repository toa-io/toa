declare namespace toa.core {

  type Event = {
    origin: Object
    state: Object
    changeset: Object
  }

}

export type Event = toa.core.Event
