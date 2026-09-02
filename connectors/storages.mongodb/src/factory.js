import { Client } from './client.js'
import { Storage } from './storage.js'

class Factory {
  storage (locator, entity, options = {}) {
    const client = new Client(locator, options.outbox === true)

    return new Storage(client, entity)
  }
}

export { Factory }
