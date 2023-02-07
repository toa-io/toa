declare namespace toa.generic {

  type lazy = <T extends Function>(
    context: object,
    initializers: Function | Function[],
    method: T
  ) => T

}

export const lazy: toa.generic.lazy
