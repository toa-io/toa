declare namespace toa.generic.map {
  type kv = (key: string, value: any) => [key: string, value: any]
  type v = (value: any) => any

  type transform = kv & v
}
