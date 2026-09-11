import { Client } from './client.js'
import { Storage } from './storage.js'

export class Factory {
  storage(locator, entity, options = {}) {
    const client = new Client(locator, options.outbox === true, options.inbox === true)

    return new Storage(client, entity)
  }
}
