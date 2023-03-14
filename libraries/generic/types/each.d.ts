declare namespace toa.generic {

  namespace each {
    type Callback<T> = (element: T, index: number) => Promise<void> | void
  }

  type Each<T> = (iterable: Array<T>, callback: each.Callback<T>) => Promise<void> | void

}
