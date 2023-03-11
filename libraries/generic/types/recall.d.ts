declare namespace toa.generic {

  type recall = <T extends Function>(
    context: object,
    method?: T
  ) => T | Promise<void>

}
