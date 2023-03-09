declare namespace toa.generic {

  type track = <T extends Function>(
    context: object,
    method?: T
  ) => T | Promise<void> | undefined

}
