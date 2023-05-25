declare namespace toa.generic.map {
  type kv<T> = (key: string, value: T) => [key: string, value: T]
  type v<T> = (value: T) => T

  type transform<T> = kv<T> & v<T>
}
