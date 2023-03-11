declare namespace toa.generic {

  type Promex<T> = Promise<T> & {
    resolve: (value?: T) => void
    reject: (error?: Error) => void
    callback: (error: Error, result: T) => void
  }

}
