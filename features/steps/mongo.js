'use strict'

const { Given } = require('@cucumber/cucumber')
const { MongoClient } = require('mongodb')

Given('the {component} database contains:',
  /**
   * @param {string} id
   * @param {import('@cucumber/cucumber').DataTable} table
   * @this {toa.features.Context}
   */
  async function(id, table) {
    const client = new MongoClient('mongodb://developer:secret@localhost:27017')

    await client.connect()

    const [name, namespace = 'default'] = id.split('.').reverse()
    const collname = `${namespace}_${name}`.toLowerCase()
    const collection = client.db('toa-dev').collection(collname)
    const columns = table.raw()[0]
    const rows = table.rows()
    const documents = []

    for (let r = 0; r < rows.length; r++) {
      const document = {}

      for (let c = 0; c < columns.length; c++) {
        const str = rows[r][c]
        const int = parseInt(str)

        document[columns[c]] = int.toString() === str ? int : str
      }

      documents.push(document)
    }

    await collection.deleteMany({})

    if (documents.length > 0) {
      await collection.insertMany(documents)
    }

    await client.close()
  })
