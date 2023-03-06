declare namespace toa.generic {

  type failsafe = <T extends Function>(
    context: object,
    recover: Function,
    method: T
  ) => T

}
