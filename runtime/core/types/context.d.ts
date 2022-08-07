// noinspection ES6UnusedImports

import { Request } from './request'
import { Reply } from './reply'
import * as extensions from './extensions'
import { Connector } from './connector'

declare namespace toa.core {

  interface Context extends Connector {
    extensions: extensions.Context[]

    /**
     * Calls local endpoint
     */
    apply(endpoint: string, request: Request): Promise<Reply>

    /**
     * Calls remote endpoint
     */
    call(namespace: string, name: string, endpoint: string, request: Request): Promise<Reply>
  }

}

export type Context = toa.core.Context
