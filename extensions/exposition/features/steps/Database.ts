import * as assert from 'node:assert'
import { afterAll, beforeAll, binding, given, then } from 'specumber'

import { MongoClient } from 'mongodb'
import type { Collection } from 'mongodb'
import type { DataTable } from '@cucumber/cucumber'

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

        // a cell left empty is a property the record does not have, as a record written
        // before the property was declared has none
        if (str === '') continue

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
                  : str.startsWith('{')
                    ? JSON.parse(str)
                    : str
      }

      /*
       * A record that has never been written carries no timestamps, and the entity stamps
       * the ones it is missing as it is read — with the time it was read. The same row then
       * enumerates differently on every request, which is a body that never hashes to the tag
       * a client was given.
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

  /**
   * What a database written before its component's migrations looks like: no index but the
   * one on `_id`, and nothing recorded as applied, so the next start applies all of them.
   */
  @given('the `{word}` database has not been migrated')
  public async unmigrated(id: string): Promise<void> {
    const collection = this.collection(id)

    await collection.deleteMany({})

    try {
      await collection.dropIndexes()
    } catch (error) {
      // a collection nothing has written to yet has no indexes to drop
      if ((error as { code?: number }).code !== ERR_NAMESPACE_NOT_FOUND) throw error
    }

    await this.migrations().deleteMany({
      _id: { $regex: `^${collection.collectionName}:` }
    })
  }

  /** The next start applies it, whatever was applied before it. */
  @given('the `{word}` migration `{word}` is not recorded')
  public async forget(id: string, migration: string): Promise<void> {
    const collection = this.collection(id)

    await this.migrations().deleteOne({
      _id: `${collection.collectionName}:${migration}`
    })
  }

  @then('the `{word}` migrations are recorded:')
  public async recorded(id: string, table: DataTable): Promise<void> {
    const collection = this.collection(id)

    for (const { migration, state } of table.hashes()) {
      const row = await this.migrations().findOne({
        _id: `${collection.collectionName}:${migration}`
      })

      assert.equal(
        row?.state,
        state,
        `migration '${migration}' of '${id}' is not ${state}`
      )
    }
  }

  /** The `keys` column is the index specification as the driver reports it. */
  @then('the `{word}` collection has indexes:')
  public async indexes(id: string, table: DataTable): Promise<void> {
    const indexes = await this.collection(id).listIndexes().toArray()

    for (const { name, keys, unique } of table.hashes()) {
      const index = indexes.find((candidate) => candidate.name === name)

      assert.ok(
        index !== undefined,
        `index '${name}' not found, there is ${indexes.map((i) => i.name).join(', ')}`
      )

      if (keys !== undefined) assert.deepStrictEqual(index.key, JSON.parse(keys))
      if (unique !== undefined) assert.equal(index.unique === true, unique === 'true')
    }
  }

  @then('the `{word}` record `{word}` is of version {int}')
  public async version(id: string, record: string, version: number): Promise<void> {
    const document = await this.collection(id).findOne({ _id: record })

    assert.equal(
      document?.VERSION,
      version,
      `'${record}' of '${id}' is of another version`
    )
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

  /** Where the storage records what it applied, as `<collection>:<migration>`. */
  private migrations(): Collection<Migration> {
    return Database.client.db('toa-dev').collection(MIGRATIONS)
  }
}

const MIGRATIONS = 'system_migrations'
const ERR_NAMESPACE_NOT_FOUND = 26

const TIMESTAMPS = ['CREATED', 'UPDATED', 'DELETED']

interface Migration {
  _id: string
  state: string
}

/** Every fixture table names an `_id`, which is what a row is replaced by. */
type Document = Record<string, string | number | boolean | Date | null> & { _id: string }
