declare namespace toa.connectors {

  namespace pointer {
    type Options = {
      port?: number
      prefix?: string
    }
  }

  interface Pointer {
    protocol
    host
    port
    hostname
    reference
  }

}

export type Pointer = toa.connectors.Pointer
