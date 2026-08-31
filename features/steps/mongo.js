'use strict'

const assert = require('node:assert')
const { Given, Then, When } = require('@cucumber/cucumber')
const { MongoClient } = require('mongodb')

Given('the {component} database contains:',
  /**
   * @param {string} id
   * @param {import('@cucumber/cucumber').DataTable} table
   * @this {toa.features.Context}
   */
  async function (id, table) {
    const documents = parse(table)

    await using(id, async (collection, outbox) => {
      await collection.deleteMany({})

      // rows left behind would be swept into the next scenario
      await outbox.deleteMany({})

      if (documents.length > 0)
        await collection.insertMany(documents)
    })
  })

Given('the {component} outbox contains:',
  /**
   * Seeding a row directly is the post-crash state: the entity was written, the event was
   * not published, and nothing is left to publish it but the sweep.
   */
  async function (id, table) {
    const rows = parse(table).map(({ event, ...rest }) => ({
      published: false,
      ...rest,
      event: JSON.parse(event)
    }))

    await using(id, async (_, outbox) => {
      if (rows.length > 0) await outbox.insertMany(rows)
    })
  })

When('I make the {component} outbox rows due',
  async function (id) {
    await using(id, async (_, outbox) =>
      outbox.updateMany({}, { $set: { pending: 0 } }))
  })

Then('the {component} outbox is empty',
  async function (id) {
    await using(id, async (_, outbox) =>
      assert.strictEqual(await outbox.countDocuments({}), 0))
  })

Then('the {component} outbox holds {int} published row(s)',
  async function (id, count) {
    await using(id, async (_, outbox) =>
      assert.strictEqual(await outbox.countDocuments({ published: true }), count))
  })

Then('the {component} outbox holds {int} unpublished row(s)',
  async function (id, count) {
    await using(id, async (_, outbox) =>
      assert.strictEqual(await outbox.countDocuments({ published: false }), count))
  })

Then('the {component} outbox row carries an origin',
  async function (id) {
    await using(id, async (_, outbox) => {
      const [row] = await outbox.find({}).sort({ _id: -1 }).limit(1).toArray()

      assert.ok(row !== undefined, 'no outbox row')
      assert.ok(row.event.origin !== undefined && row.event.origin !== null,
        'outbox row has no origin: ' + JSON.stringify(row.event))
    })
  })

Then('the {component} record matches the last reply',
  /**
   * The post-image an assignment returns is computed from the pre-image rather than read
   * back, so this asserts the computation still mirrors the update it stands for.
   *
   * @this {toa.features.Context}
   */
  async function (id) {
    const reply = this.reply

    await using(id, async (collection) => {
      const stored = await collection.findOne({ _id: reply.id })

      assert.ok(stored !== null, 'record not found')

      const { _id, ...rest } = stored

      assert.deepStrictEqual({ id: _id, ...rest }, reply)
    })
  })

/**
 * @param {import('@cucumber/cucumber').DataTable} table
 */
function parse (table) {
  const columns = table.raw()[0]
  const rows = table.rows()
  const documents = []

  for (let r = 0; r < rows.length; r++) {
    const document = {}

    for (let c = 0; c < columns.length; c++) {
      const str = rows[r][c]
      const int = parseInt(str)

      document[columns[c]] = int.toString() === str ? int : (str === 'null' ? null : str)
    }

    documents.push(document)
  }

  return documents
}

async function using (id, fn) {
  const client = new MongoClient(URL)

  await client.connect()

  const [name, namespace = 'default'] = id.split('.').reverse()
  const collname = `${namespace}_${name}`.toLowerCase()
  const db = client.db('toa-dev')

  try {
    await fn(db.collection(collname), db.collection(collname + '_outbox'))
  } finally {
    await client.close()
  }
}

const URL = 'mongodb://developer:secret@localhost:27017'
