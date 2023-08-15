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

    const columns = table.raw()[0]
    const rows = table.rows()
    const documents = Array(rows.length)

    for (let r = 0; r < rows.length; r++) {
      const document: Record<string, string | number> = {}

      for (let c = 0; c < columns.length; c++) {
        const str = rows[r][c]
        const int = parseInt(str)

        document[columns[c]] = int.toString() === str ? int : str
      }

      documents[r] = document
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
