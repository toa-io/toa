import { afterAll, beforeAll, binding, when } from 'cucumber-tsflow'
import { type DataTable } from '@cucumber/cucumber'
import { MongoClient } from 'mongodb'

@binding()
export class Database {
  private static client: MongoClient

  @when('the `{word}` database contains:')
  public async upsert (id: string, table: DataTable): Promise<void> {
    const [name, namespace = 'default'] = id.split('.').reverse()
    const collection = Database.client.db(namespace).collection(name)

    const rows = table.raw()
    const columns = rows[0]
    const documents = Array(rows.length - 1)

    for (let r = 1; r < rows.length; r++) {
      const document: Record<string, any> = {}

      for (let c = 0; c < columns.length; c++)
        document[columns[c]] = rows[r][c]

      documents[r - 1] = document
    }

    await collection.deleteMany()
    await collection.insertMany(documents)
  }

  @beforeAll()
  public static async connect (): Promise<void> {
    Database.client = new MongoClient('mongodb://developer:secret@localhost:27017')

    await Database.client.connect()
  }

  @afterAll()
  public async disconnect (): Promise<void> {
    await Database.client.close()
  }
}
