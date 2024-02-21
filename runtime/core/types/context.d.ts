import * as _request from './request'
import * as _reply from './reply'
import * as _extensions from './extensions'
import * as _connector from './connector'

export interface Context extends _connector.Connector{
  aspects: _extensions.Aspect[]

  /**
   * Calls local endpoint
   */
  apply (endpoint: string, request: _request.Request): Promise<_reply.Reply>

  /**
   * Calls remote endpoint
   */
  call (namespace: string, name: string, endpoint: string, request: _request.Request): Promise<_reply.Reply>

  // shortcuts
  [key: string]: any
}
