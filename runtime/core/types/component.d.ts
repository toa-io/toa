import { Connector } from './connector'
import { Locator } from './locator'
import { Request } from './request'
import { Operation } from './operations'

export class Component extends Connector {
  locator: Locator

  constructor (locator: Locator, operations: Record<string, Operation>)

  invoke<T = any> (endpoint: string, request: Request): Promise<T>
}
