// noinspection ES6UnusedImports

import { Connector } from './connector'
import { Locator } from './locator'
import { Request } from './request'
import { Reply } from './reply'

declare namespace toa.core {

  interface Runtime extends Connector {
    locator: Locator

    invoke(endpoint: string, request: Request): Promise<Reply>
  }

}

export type Runtime = toa.core.Runtime
