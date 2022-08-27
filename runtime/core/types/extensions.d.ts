import * as index from './index'

declare namespace toa.core.extensions {

  interface Factory {
    tenant?(locator: index.Locator, declaration: Object): index.Connector | undefined

    annex?(locator: index.Locator, declaration: Object): Annex

    service?(name?: string): index.Connector | undefined
  }

  interface Annex extends index.Connector {
    name: string
    invoke: Function
  }

}

export type Factory = toa.core.extensions.Factory
export type Annex = toa.core.extensions.Annex
