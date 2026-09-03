import { Connector } from './connector.js'
import { Locator } from './locator.js'
import { Request } from './request.js'
import { Operation } from './operations.js'

export class Component extends Connector {
  locator: Locator

  constructor (locator: Locator, operations: Record<string, Operation>)

  invoke<T = any> (endpoint: string, request: Request): Promise<T>
}
