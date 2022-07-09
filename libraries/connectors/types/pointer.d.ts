declare namespace toa.connectors {

  namespace pointer {
    type Options = {
      port?: number
      prefix?: string
      path?: string
    }
  }

  interface Pointer {
    protocol
    host
    port
    hostname
    path
    reference
    label
  }

}

export type Pointer = toa.connectors.Pointer
