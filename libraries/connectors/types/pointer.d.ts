declare namespace toa.connectors {

  interface Pointer {
    protocol
    host
    port
    hostname
    reference
  }

}

export type Pointer = toa.connectors.Pointer
