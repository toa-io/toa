declare namespace toa.connectors {

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

export type Pointer = toa.connectors.Pointer
