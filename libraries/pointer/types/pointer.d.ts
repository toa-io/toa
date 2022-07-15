declare namespace toa.pointer {

  type Validator = (url: URL) => void

  type Options = {
    protocol: string    // for local environment
    validate?: Validator
  }

  class Pointer {
    protocol: string
    host: string
    port: number
    hostname: string
    path: string
    username: string
    password: string
    reference: string
    label: string     // safe for logging
  }

}

export type Pointer = toa.pointer.Pointer
