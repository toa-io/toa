import assert from 'node:assert'
import { Given, Then, When } from '@cucumber/cucumber'
import { MongoClient } from 'mongodb'

Given('the {component} database contains:',
  /**
   * @param {string} id
   * @param {import('@cucumber/cucumber').DataTable} table
   * @this {toa.features.Context}
   */
  async function (id, table) {
    const documents = parse(table)

    await using(id, async (collection, outbox, db) => {
      await collection.deleteMany({})

      // dropped, not emptied: the collection is created at boot, and one left behind by an
      // earlier scenario would read as one this scenario's boot created
      await outbox.drop().catch(() => undefined)
      await forget(db, collection)

      if (documents.length > 0)
        await collection.insertMany(documents)
    })
  })

Given('the {component} database is empty',
  /**
   * @param {string} id
   */
  async function (id) {
    await using(id, async (collection, outbox, db) => {
      await collection.deleteMany({})
      await outbox.drop().catch(() => undefined)
      await forget(db, collection)
    })
  })

Given('the {component} outbox contains:',
  /**
   * Seeding a row directly is the post-crash state: the entity was written, the event was
   * not published, and nothing is left to publish it but the pump.
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

Then('the {component} outbox collection does not exist',
  /**
   * The collection is created at boot beside the entity's, so its absence is the assertion
   * that nothing was set up to publish.
   */
  async function (id) {
    await using(id, async (_, outbox, db) => {
      const found = await db.listCollections({ name: outbox.collectionName }).toArray()

      assert.strictEqual(found.length, 0,
        `outbox collection '${outbox.collectionName}' exists`)
    })
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

Then('the {component} collection holds:',
  /**
   * @param {string} id
   * @param {import('@cucumber/cucumber').DataTable} table
   * @this {toa.features.Context}
   */
  async function (id, table) {
    await using(id, async (collection) => {
      for (const document of parse(table)) {
        const found = await collection.findOne(document)

        assert.ok(found !== null,
          `no record matching ${JSON.stringify(document)}, there is ` +
          JSON.stringify(await collection.find().toArray()))
      }
    })
  })

Given('the {component} migration {word} is recorded',
  /**
   * A migration whose row says it is done is one no replica applies, which is what makes a
   * scenario boot a component that has already migrated.
   *
   * @param {string} id
   * @param {string} migration
   * @this {toa.features.Context}
   */
  async function (id, migration) {
    await using(id, async (collection, _, db) => {
      await db.collection('system_migrations').replaceOne(
        { _id: `${collection.collectionName}:${migration}` },
        { state: 'done', owner: 'features', started: new Date(), heartbeat: new Date(), completed: new Date() },
        { upsert: true })
    })
  })

Then('the {component} collection has indexes:',
  /**
   * The `keys` column is the index specification as the driver reports it, so a changed
   * declaration is visible here as a changed spec under the same name.
   *
   * @param {string} id
   * @param {import('@cucumber/cucumber').DataTable} table
   * @this {toa.features.Context}
   */
  async function (id, table) {
    await using(id, async (collection) => {
      const indexes = await collection.listIndexes().toArray()

      for (const { name, keys, unique, sparse } of table.hashes()) {
        const index = indexes.find((candidate) => candidate.name === name)

        assert.ok(index !== undefined,
          `index '${name}' not found, there is ${indexes.map((i) => i.name).join(', ')}`)

        if (keys !== undefined) assert.deepStrictEqual(index.key, JSON.parse(keys))
        if (unique !== undefined) assert.strictEqual(index.unique === true, unique === 'true')
        if (sparse !== undefined) assert.strictEqual(index.sparse === true, sparse === 'true')
      }
    })
  })

Then('the {component} migrations are recorded:',
  /**
   * @param {string} id
   * @param {import('@cucumber/cucumber').DataTable} table
   * @this {toa.features.Context}
   */
  async function (id, table) {
    await using(id, async (collection, _, db) => {
      const rows = await db.collection('system_migrations')
        .find({ _id: { $regex: `^${collection.collectionName}:` } }).toArray()

      for (const { migration, state } of table.hashes()) {
        const row = rows.find(({ _id }) => _id === `${collection.collectionName}:${migration}`)

        assert.ok(row !== undefined,
          `migration '${migration}' is not recorded, there is ` +
          rows.map(({ _id }) => _id).join(', '))

        assert.strictEqual(row.state, state)
      }
    })
  })

/**
 * Migrations are applied once for a database and their rows outlive a scenario, so a component
 * whose structure a scenario has just reset would keep the one an earlier run gave it —
 * including one an edited migration file no longer describes.
 */
async function forget (db, collection) {
  await db.collection('system_migrations')
    .deleteMany({ _id: { $regex: `^${collection.collectionName}:` } })
}

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
    await fn(db.collection(collname), db.collection(collname + '_outbox'), db)
  } finally {
    await client.close()
  }
}

const URL = 'mongodb://developer:secret@localhost:27017'
