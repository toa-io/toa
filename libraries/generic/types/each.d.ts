declare namespace toa.generic {

  namespace each {
    type Callback<T> = (element: T, index: number) => Promise<void> | void
  }

  type Each<T> = (array: Array<T>, callback: each.Callback<T>) => Promise<void> | void

}
