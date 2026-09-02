import { Connector } from '@toa.io/core'

/**
 * @implements {toa.core.Storage}
 */
class Storage extends Connector {
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

export { Storage }
