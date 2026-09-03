import { Connection } from './connection.js'
import { Client } from './client.js'
import { Storage } from './storage.js'
import { Migration } from './migration.js'

export class Factory {
  storage (locator) {
    const connection = new Connection(locator)
    const client = new Client(connection)

    return new Storage(client)
  }

  migration (driver) {
    return new Migration(driver)
  }
}
