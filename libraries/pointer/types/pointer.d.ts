declare namespace toa.pointer {

  class Pointer {
    protocol
    host
    port
    hostname
    path
    reference
    label       // safe for logging
  }

}

export type Pointer = toa.pointer.Pointer
