import * as index from './index'
import * as _component from './component'

declare namespace toa.core.extensions {

  interface Factory {
    tenant?(locator: index.Locator, declaration: Object): index.Connector

    annex?(locator: index.Locator, declaration: Object): Annex

    service?(name?: string): index.Connector

    component?(component: _component.Component): _component.Component
  }

  interface Annex extends index.Connector {
    name: string
    invoke: Function
  }

}

export type Factory = toa.core.extensions.Factory
export type Annex = toa.core.extensions.Annex
