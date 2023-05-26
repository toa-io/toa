import * as _core from '@toa.io/core/types'

declare namespace toa.boot {

  namespace composition {

    type Options = {
      bindings?: string[]
      storage?: string
      extensions?: string[]
    }

  }

  type Composition = (paths: string[], options: composition.Options) => Promise<_core.Connector>

}

export type Options = toa.boot.composition.Options
export type Composition = toa.boot.Composition
