import * as _core from './connector'

declare namespace toa.core {

  namespace reflection {
    type Source = () => Promise<any>
  }

  interface Reflection<T> extends _core.Connector {
    value: T
  }
}

export type Source = toa.core.reflection.Source
