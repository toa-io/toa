import { Connector } from './connector'
import { Locator } from './locator'
import { Request } from './request'
import { Reply } from './reply'

export interface Component extends Connector {
  locator: Locator

  invoke (endpoint: string, request: Request): Promise<Reply>
}
