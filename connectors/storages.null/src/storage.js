import { Connector } from '@toa.io/core'

/**
 * @implements {toa.core.Storage}
 */
export class Storage extends Connector {
  async get (_) {
    return null
  }

  async add (_) {
    return true
  }

  async store (_) {
    return true
  }
}
