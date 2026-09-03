import { Connector } from '@toa.io/core'
import { newid } from '@toa.io/generic'

/**
 * @implements {toa.core.Storage}
 */
export class Storage extends Connector {
  async get (_) {
    return { id: newid(), _version: 1 }
  }

  async store (_) {
    return true
  }

  async upsert (_, __, ___) {
    return { id: newid(), _version: 1 }
  }
}
