declare namespace toa.pointer {

  type Validator = (url: URL) => void

  type Options = {
    protocol: string    // for local environment
    validate?: Validator
  }

  class Pointer {
    protocol
    host
    port
    hostname
    path
    reference
    label     // safe for logging
  }

}

export type Pointer = toa.pointer.Pointer
