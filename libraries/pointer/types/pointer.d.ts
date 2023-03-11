declare namespace toa.pointer {

  type Options = {
    protocol: string    // for local environment
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
