import tsflow from 'cucumber-tsflow'

import { MongoClient } from 'mongodb'
import type { Collection } from 'mongodb'
import type { DataTable } from '@cucumber/cucumber'

const { afterAll, beforeAll, binding, given } = tsflow

@binding()
export class Database {
  private static client: MongoClient

  @given('the `{word}` database contains:')
  public async upsert (id: string, table: DataTable): Promise<void> {
    const collection = this.collection(id)
    const columns = table.raw()[0]
    const rows = table.rows()
    const documents: Document[] = []

    for (let r = 0; r < rows.length; r++) {
      const document: Document = {}

      for (let c = 0; c < columns.length; c++) {
        const str = rows[r][c]
        const int = parseInt(str)

        document[columns[c]] = int.toString() === str
          ? int
          : str === 'null'
            ? null
            : str === 'true'
              ? true
              : str === 'false'
                ? false
                : str
      }

      /*
       * A record that has never been written carries no timestamps, and the entity stamps
       * the ones it is missing as it is read — with the time it was read. The same row then
       * enumerates differently on every request, which is a moving `etag` and a collection
       * that is never unmodified.
       */
      document._created ??= Date.now()
      document._updated ??= document._created

      documents.push(document)
    }

    /*
     * Replaced rather than inserted: the collections a scenario writes are also written by
     * the composition it runs, and by whatever a suite before it left behind. An insert that
     * meets a row of its own id fails the scenario over state that the step is there to
     * overwrite in the first place.
     */
    await collection.deleteMany({})

    if (documents.length > 0)
      await collection.bulkWrite(documents.map((document) => ({
        replaceOne: { filter: { _id: document._id }, replacement: document, upsert: true }
      })))
  }

  @given('the `{word}` database is empty')
  public async truncate (id: string): Promise<void> {
    await this.collection(id).deleteMany({})
  }

  @beforeAll()
  public static async connect (): Promise<void> {
    this.client = new MongoClient('mongodb://developer:secret@localhost:31020')

    await this.client.connect()
  }

  @afterAll()
  public static async disconnect (): Promise<void> {
    await this.client.close()
  }

  private collection (id: string): Collection<Document> {
    const [name, namespace = 'default'] = id.split('.').reverse()
    const collection = `${namespace}_${name}`.toLowerCase()

    // typed by what a scenario writes, whose `_id` is a string rather than an `ObjectId`
    return Database.client.db('toa-dev').collection<Document>(collection)
  }
}

/** A row of a scenario's table. `_id` is named so that the driver takes it for a string. */
interface Document extends Record<string, string | number | boolean | null | undefined> {
  _id?: string
}
