import * as _request from './request'
import * as _reply from './reply'
import * as _extensions from './extensions'
import * as _connector from './connector'

declare namespace toa.core {

  interface Context extends _connector.Connector {
    annexes: _extensions.Annex[]

    /**
     * Calls local endpoint
     */
    apply(endpoint: string, request: _request.Request): Promise<_reply.Reply>

    /**
     * Calls remote endpoint
     */
    call(namespace: string, name: string, endpoint: string, request: _request.Request): Promise<_reply.Reply>
  }

}

export type Context = toa.core.Context
