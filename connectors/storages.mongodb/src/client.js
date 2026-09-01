'use strict'

/**
 * @typedef {import('mongodb').MongoClient} MongoClient
 * @typedef {{ count: number, client: MongoClient }} Instance
 * @typedef {import('@toa.io/core').Locator} Locator
 */

const { console } = require('openspan')
const { Connector } = require('@toa.io/core')
const { resolve } = require('@toa.io/pointer')
const { ID } = require('./deployment')
const { MongoClient } = require('mongodb')

/**
 * @type {Record<string, Promise<Instance>>}
 */
const INSTANCES = {}

class Client extends Connector {
  name

  /**
   * @public
   * @type {import('mongodb').Collection}
   */
  collection

  /**
   * The outbox rows of this component, absent unless something consumes its events. Created
   * eagerly beside the entity collection, because a transaction cannot create a collection and
   * an index build cannot run inside one.
   *
   * @public
   * @type {import('mongodb').Collection | undefined}
   */
  outbox

  /**
   * Whether this deployment can run transactions at all. A standalone mongod cannot, and an
   * outbox without atomicity is worse than none, so the storage falls back to inline emission.
   *
   * @public
   * @type {boolean}
   */
  transactional = false

  /**
   * @private
   * @type {Locator}
   */
  locator

  /**
   * @private
   * @type {Instance}
   */
  instance

  /**
   * @private
   * @type {string}
   */
  key

  /**
   * @private
   * @type {boolean}
   */
  publishes

  /**
   * @param {Locator} locator
   * @param {boolean} [publishes] whether this component publishes anything
   */
  constructor (locator, publishes = false) {
    super()

    this.locator = locator
    this.name = locator.lowercase
    this.publishes = publishes
  }

  /**
   * @protected
   * @override
   * @return {Promise<void>}
   */
  async open () {
    const urls = await this.resolveURLs()
    const dbname = this.resolveDB()

    this.key = getKey(dbname, urls)

    try {
      INSTANCES[this.key] ??= this.createInstance(urls)
    } catch (error) {
      console.error('Failed to connect to MongoDB', { urls, error })
    }

    this.instance = await INSTANCES[this.key]
    this.instance.count++

    const db = this.instance.client.db(dbname)

    this.collection = await collection(db, this.name)
    this.transactional = await transactional(db)

    if (!this.publishes) return

    if (this.transactional) this.outbox = await collection(db, this.name + OUTBOX)
    else
      console.warn('MongoDB is not a replica set; events are emitted inline, without an outbox',
        { collection: this.name })
  }

  /**
   * Runs `fn` in a transaction and answers what it returned. The driver may call `fn` more
   * than once, so it must not hold state of its own — an outbox row is built by the caller
   * and reused, and a rolled back attempt leaves nothing behind.
   *
   * @public
   * @template T
   * @param {(session: import('mongodb').ClientSession) => Promise<T>} fn
   * @return {Promise<T>}
   */
  async transaction (fn) {
    return this.instance.client.withSession(async (session) =>
      session.withTransaction(async () => fn(session)))
  }

  /**
   * @protected
   * @override
   * @return {Promise<void>}
   */
  async close () {
    const instance = await INSTANCES[this.key]

    instance.count--

    if (instance.count === 0) {
      await instance.client.close()
      delete INSTANCES[this.key]
    }
  }

  /**
   * @private
   * @param {string[]} urls
   * @return {Promise<Instance>}
   */
  async createInstance (urls) {
    const client = new MongoClient(urls.join(','), OPTIONS)
    const hosts = urls.map((str) => new URL(str).host)

    console.info('Connecting to MongoDB', { address: hosts.join(', ') })

    await client.connect()

    return {
      count: 0,
      client
    }
  }

  /**
   * @private
   * @return {Promise<string[]>}
   */
  async resolveURLs () {
    if (process.env.TOA_DEV === '1') {
      return ['mongodb://developer:secret@localhost']
    } else {
      return await resolve(ID, this.locator.id)
    }
  }

  /**
   * @private
   * @return {string}
   */
  resolveDB () {
    if (process.env.TOA_CONTEXT !== undefined) {
      return process.env.TOA_CONTEXT
    }

    if (process.env.TOA_DEV === '1') {
      return 'toa-dev'
    }

    throw new Error('Environment variable TOA_CONTEXT is not defined')
  }
}

function getKey (db, urls) {
  return db + ':' + urls.sort().join(' ')
}

/**
 * Concurrent pods race to create the same collection, and losing that race is not an error.
 */
async function collection (db, name) {
  try {
    return await db.createCollection(name)
  } catch (e) {
    if (e.code !== ALREADY_EXISTS) throw e

    return db.collection(name)
  }
}

async function transactional (db) {
  try {
    const hello = await db.admin().command({ hello: 1 })

    return hello.setName !== undefined || hello.msg === 'isdbgrid'
  } catch (e) {
    console.warn('MongoDB transaction support could not be determined', { error: e })

    return false
  }
}

/**
 * `monitorCommands` is deliberately absent. It makes the driver materialize every reply
 * eagerly to populate the monitoring event (`CommandSucceededEvent`), which defeats the
 * lazy per-document deserialization a cursor exists for — a 100-document batch is then
 * deserialized twice. `Storage` times its own calls instead.
 */
const OPTIONS = {
  ignoreUndefined: true
}

const ALREADY_EXISTS = 48
const OUTBOX = '_outbox'

exports.Client = Client
