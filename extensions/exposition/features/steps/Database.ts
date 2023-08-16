import { afterAll, beforeAll, binding, given } from 'cucumber-tsflow'
import { type DataTable } from '@cucumber/cucumber'
import { MongoClient } from 'mongodb'

@binding()
export class Database {
  private static client: MongoClient

  @given('the `{word}` database contains:')
  public async upsert (id: string, table: DataTable): Promise<void> {
    const [name, namespace = 'default'] = id.split('.').reverse()
    const collection = Database.client.db(namespace).collection(name)

    const columns = table.raw()[0]
    const rows = table.rows()
    const documents: Document[] = []

    for (let r = 0; r < rows.length; r++) {
      const document: Document = {}

      for (let c = 0; c < columns.length; c++) {
        const str = rows[r][c]
        const int = parseInt(str)

        document[columns[c]] = int.toString() === str ? int : str
      }

      documents.push(document)
    }

    await collection.deleteMany({})
    await collection.insertMany(documents)
  }

  @beforeAll()
  public static async connect (): Promise<void> {
    this.client = new MongoClient('mongodb://developer:secret@localhost:27017')

    await this.client.connect()
  }

  @afterAll()
  public static async disconnect (): Promise<void> {
    await this.client.close()
  }
}

type Document = Record<string, string | number>
