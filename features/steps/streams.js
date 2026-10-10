import assert from 'node:assert'
import { After, Given, Then, When } from '@cucumber/cucumber'
import { diff } from 'jest-diff'
import { match } from '@toa.io/generic'
import { load as parse } from 'js-yaml'
import { MongoClient } from 'mongodb'

import * as stage from './.workspace/components/index.js'

/*
 * A reader keeping a copy of a collection: what it read is applied to the copy the way a client applies
 * it — the higher `VERSION` kept, a removed entry dropped — and the token it ended with is kept for
 * the next read.
 */

When(
  'I read {endpoint} with:',
  /**
   * @param {string} endpoint
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function (endpoint, yaml) {
    this.reading = { copy: new Map(), token: undefined, parts: [] }

    await read.call(this, endpoint, parse(yaml) ?? {})
  }
)

When(
  'I read {endpoint} from the token with:',
  /**
   * @param {string} endpoint
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function (endpoint, yaml) {
    assert.ok(typeof this.reading?.token === 'string', 'No token was read before')

    const request = parse(yaml) ?? {}

    request.query = { ...request.query, token: this.reading.token }

    await read.call(this, endpoint, request)
  }
)

When(
  'I read the whole of {endpoint} in windows of {int} with:',
  /**
   * @param {string} endpoint
   * @param {number} limit
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function (endpoint, limit, yaml) {
    this.reading = { copy: new Map(), token: undefined, parts: [] }

    const request = parse(yaml) ?? {}

    for (let window = 0; ; window++) {
      assert.ok(window < 10_000, 'The windows never ran short')

      const query = { ...request.query, limit }

      if (this.reading.token !== undefined) query.token = this.reading.token

      const read = await readOnce.call(this, endpoint, { ...request, query })

      assert.ok(this.exception === undefined, this.exception?.message)
      assert.ok(this.reading.ended, `Window ${window} ended without a token`)

      if (read < limit) break
    }
  }
)

Then(
  'the stream ended with a token',
  /** @this {toa.features.Context} */
  function () {
    if (this.exception !== undefined) throw this.exception

    assert.ok(this.reading.ended, 'The stream ended without a token')
    assert.equal(
      typeof this.reading.token,
      'string',
      `The token is ${this.reading.token}`
    )
  }
)

Then(
  'the stream ended with no position to continue from',
  /** @this {toa.features.Context} */
  function () {
    if (this.exception !== undefined) throw this.exception

    assert.ok(this.reading.ended, 'The stream ended without a token')
    assert.strictEqual(this.reading.token, null)
  }
)

Then(
  'the stream ended without a token',
  /** @this {toa.features.Context} */
  function () {
    if (this.exception !== undefined) throw this.exception

    assert.ok(!this.reading.ended, 'The stream ended with a token')
  }
)

Then(
  'the copy holds:',
  /**
   * Every entry of the table, and nothing else.
   *
   * @param {import('@cucumber/cucumber').DataTable} table
   * @this {toa.features.Context}
   */
  function (table) {
    if (this.exception !== undefined) throw this.exception

    const expected = table.hashes().map(typed)
    const held = [...this.reading.copy.values()]

    assert.equal(held.length, expected.length, diff(expected, held))

    for (const entry of expected) {
      const found = this.reading.copy.get(entry.id)

      assert.ok(found !== undefined && match(found, entry), diff(entry, found))
    }
  }
)

Then(
  'the copy holds {int} entries',
  /**
   * @param {number} count
   * @this {toa.features.Context}
   */
  function (count) {
    if (this.exception !== undefined) throw this.exception

    assert.equal(this.reading.copy.size, count)
  }
)

Then(
  'the parts read are:',
  /**
   * What the last read yielded before its token, in order.
   *
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  function (yaml) {
    if (this.exception !== undefined) throw this.exception

    const expected = parse(yaml) ?? []
    const read = this.reading.parts

    assert.equal(read.length, expected.length, diff(expected, read))
    assert.ok(match(read, expected), diff(expected, read))
  }
)

Given(
  'a transaction writes to the {component} collection, and is held open:',
  /**
   * @param {string} id
   * @param {import('@cucumber/cucumber').DataTable} table
   * @this {toa.features.Context}
   */
  async function (id, table) {
    const client = new MongoClient(URL)

    await client.connect()

    const session = client.startSession()

    session.startTransaction()

    const collection = client.db(DATABASE).collection(collection_(id))

    for (const document of table.hashes().map(typed)) {
      const { id: _id, ...rest } = document

      await collection.insertOne({ _id, ...defaults(), ...rest }, { session })
    }

    this.held = { client, session }
  }
)

When(
  'the transaction commits',
  /** @this {toa.features.Context} */
  async function () {
    assert.ok(this.held !== undefined, 'No transaction is held open')

    await this.held.session.commitTransaction()
    await release(this)
  }
)

When(
  'the {component} record {token} is taken out of the collection',
  /**
   * @param {string} id
   * @param {string} record
   */
  async function (id, record) {
    await using(id, (collection) => collection.deleteOne({ _id: record }))
  }
)

When(
  'the {component} record {token} arrives as another region wrote it:',
  /**
   * A converged write: the record replaced as it stands, timestamps and all.
   *
   * @param {string} id
   * @param {string} record
   * @param {string} yaml
   */
  async function (id, record, yaml) {
    const document = parse(yaml)

    for (const name of ['CREATED', 'UPDATED'])
      if (typeof document[name] === 'number') document[name] = new Date(document[name])

    await using(id, (collection) =>
      collection.replaceOne({ _id: record }, document, { upsert: true })
    )
  }
)

After(
  /** @this {toa.features.Context} */
  async function () {
    if (this.held !== undefined) {
      await this.held.session.abortTransaction().catch(() => undefined)
      await release(this)
    }
  }
)

/**
 * @param {string} endpoint
 * @param {object} request
 * @this {toa.features.Context}
 */
async function read(endpoint, request) {
  await readOnce.call(this, endpoint, request)
}

/**
 * Makes the call and applies what it yields. Answers how many entries and removals it read.
 *
 * @this {toa.features.Context}
 */
async function readOnce(endpoint, request) {
  this.exception = undefined
  this.reading.parts = []
  this.reading.ended = false

  const [operation, component, namespace = 'default'] = endpoint.split('.').reverse()

  let remote

  try {
    remote = await stage.remote(`${namespace}.${component}`)

    const reply = await remote.invoke(operation, request)

    for await (const part of reply) {
      assert.ok(
        !this.reading.ended,
        `A part arrived after the token: ${JSON.stringify(part)}`
      )

      if ('token' in part) {
        this.reading.token = part.token
        this.reading.ended = true
      } else {
        this.reading.parts.push(part)
        apply(this.reading.copy, part)
      }
    }
  } catch (exception) {
    this.exception = exception
  }

  await remote?.disconnect()

  return this.reading.parts.length
}

function apply(copy, part) {
  if ('removed' in part) {
    copy.delete(part.removed)

    return
  }

  const held = copy.get(part.entry.id)

  if (held === undefined || held.VERSION < part.entry.VERSION)
    copy.set(part.entry.id, part.entry)
}

async function release(context) {
  await context.held.session.endSession()
  await context.held.client.close()
  context.held = undefined
}

function typed(row) {
  const out = {}

  for (const [key, value] of Object.entries(row)) {
    const int = parseInt(value)

    out[key] = int.toString() === value ? int : value === 'null' ? null : value
  }

  return out
}

function defaults() {
  const now = new Date()

  return { CREATED: now, UPDATED: now, VERSION: 1, DELETED: null }
}

function collection_(id) {
  const [name, namespace = 'default'] = id.split('.').reverse()

  return `${namespace}_${name}`.toLowerCase()
}

async function using(id, fn) {
  const client = new MongoClient(URL)

  await client.connect()

  try {
    await fn(client.db(DATABASE).collection(collection_(id)))
  } finally {
    await client.close()
  }
}

const URL = 'mongodb://developer:secret@localhost:31020'
const DATABASE = 'toa-dev'

When(
  'the history of the MongoDB at {int} rolls over',
  { timeout: 600_000 },
  /**
   * Writes past the history MongoDB keeps, and waits until a change stream from where it started
   * can no longer be read: MongoDB keeps no less than 990 MB of it, and lets go of what is past
   * that once a checkpoint holds it, which it makes about once a minute.
   *
   * @param {number} port
   */
  async function (port) {
    const client = new MongoClient(`mongodb://localhost:${port}/?directConnection=true`)

    await client.connect()

    try {
      const db = client.db('filler')
      const filler = db.collection('filler')

      await filler.insertOne({})

      const reply = await db.command({
        aggregate: 'filler',
        pipeline: [{ $changeStream: {} }],
        cursor: { batchSize: 0 }
      })

      const start = reply.cursor.postBatchResumeToken
      const blob = 'x'.repeat(1024 * 1024 - 128)

      for (let written = 0; written < 1200; written += 16) {
        await filler.insertMany(Array.from({ length: 16 }, () => ({ blob })))
        await filler.deleteMany({})
      }

      const deadline = Date.now() + 300_000

      while (Date.now() < deadline) {
        await filler.insertOne({ blob })

        const stream = filler.watch([], { startAfter: start })
        const lost = await stream.tryNext().then(
          () => false,
          (error) => error.code === 286
        )

        await stream.close()

        if (lost) return

        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      throw new Error('MongoDB kept its history for five minutes past its size')
    } finally {
      await client
        .db('filler')
        .dropDatabase()
        .catch(() => undefined)
      await client.close()
    }
  }
)
