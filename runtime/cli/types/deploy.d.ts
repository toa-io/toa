declare namespace toa.cli.deploy {

  interface Arguments {
    path: string
    environment?: string
    namespace?: string
    dry: boolean
    wait: boolean
    timeout: string
  }
}
