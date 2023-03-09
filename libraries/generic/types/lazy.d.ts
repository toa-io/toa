declare namespace toa.generic {

  type lazy = <T extends Function>(
    context: object,
    initializers: Function | Function[],
    method: T
  ) => T

  type Lazy = lazy & {
    reset: (context: object) => void
  }

}
