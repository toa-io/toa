import { Connector } from './connector'
import { Locator } from './locator'
import { Request } from './request'

export interface Component extends Connector{
  locator: Locator

  invoke<T = any> (endpoint: string, request: Request): Promise<T>
}
