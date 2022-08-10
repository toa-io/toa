import * as connector from './connector'
import * as locator from './locator'
import * as req from './request'
import * as rep from './reply'

declare namespace toa.core {

  interface Runtime extends connector.Connector {
    locator: locator.Locator

    invoke(endpoint: string, request: req.Request): Promise<rep.Reply>
  }

}

export type Runtime = toa.core.Runtime
