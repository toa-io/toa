import * as _connector from './connector'
import * as _locator from './locator'
import * as _request from './request'
import * as _reply from './reply'

declare namespace toa.core {

  interface Component extends _connector.Connector {
    locator: _locator.Locator

    invoke(endpoint: string, request: _request.Request): Promise<_reply.Reply>
  }

}

export type Component = toa.core.Component
