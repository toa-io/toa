import { Connector } from '@toa.io/core'

/**
 * @implements {import('@toa.io/core/types').storages.Storage}
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
