import tsflow from 'cucumber-tsflow'

import { MongoClient } from 'mongodb'
import type { Collection } from 'mongodb'
import type { DataTable } from '@cucumber/cucumber'

const { afterAll, beforeAll, binding, given } = tsflow

@binding()
export class Database {
  private static client: MongoClient

  @given('the `{word}` database contains:')
  public async upsert(id: string, table: DataTable): Promise<void> {
    const collection = this.collection(id)
    const columns = table.raw()[0]
    const rows = table.rows()
    const documents: Document[] = []

    for (let r = 0; r < rows.length; r++) {
      const document = {} as Document

      for (let c = 0; c < columns.length; c++) {
        const str = rows[r][c]
        const int = parseInt(str)

        document[columns[c]] =
          int.toString() === str
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
       * enumerates differently on every request, which is a `last-modified` that moves and a
       * collection that is never unmodified.
       */
      document.CREATED ??= Date.now()
      document.UPDATED ??= document.CREATED

      // a table states a timestamp as the entity carries it; the storage holds it as a date
      for (const name of TIMESTAMPS)
        if (typeof document[name] === 'number') document[name] = new Date(document[name])

      documents.push(document)
    }

    /*
     * A component the scenario has already started writes to this collection too, and it may
     * write the very row named here — introspection records a node under the same `_id` this
     * derives. Emptying the collection and inserting leaves a window for it to land in
     * between, and the insert then fails on a duplicate key. Replacing each row named, and
     * deleting only what is not, has no such window.
     */
    const ids = documents.map((document) => document._id)

    await collection.deleteMany({ _id: { $nin: ids } })

    if (documents.length > 0)
      await collection.bulkWrite(
        documents.map((document) => ({
          replaceOne: {
            filter: { _id: document._id },
            replacement: document,
            upsert: true
          }
        }))
      )
  }

  @given('the `{word}` database is empty')
  public async truncate(id: string): Promise<void> {
    await this.collection(id).deleteMany({})
  }

  @beforeAll()
  public static async connect(): Promise<void> {
    this.client = new MongoClient('mongodb://developer:secret@localhost:31020')

    await this.client.connect()
  }

  @afterAll()
  public static async disconnect(): Promise<void> {
    await this.client.close()
  }

  private collection(id: string): Collection<Document> {
    const [name, namespace = 'default'] = id.split('.').reverse()
    const collection = `${namespace}_${name}`.toLowerCase()

    return Database.client.db('toa-dev').collection(collection)
  }
}

const TIMESTAMPS = ['CREATED', 'UPDATED', 'DELETED']

/** Every fixture table names an `_id`, which is what a row is replaced by. */
type Document = Record<string, string | number | boolean | Date | null> & { _id: string }
