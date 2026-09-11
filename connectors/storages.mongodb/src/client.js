/**
 * @typedef {import('mongodb').MongoClient} MongoClient
 * @typedef {{ count: number, client: MongoClient }} Instance
 * @typedef {import('@toa.io/core').Locator} Locator
 */

import { console } from 'openspan'
import { environment } from '@toa.io/generic'
import { Connector } from '@toa.io/core'
import { resolve } from '@toa.io/pointer'
import { ID } from '@toa.io/definitions/storages.mongodb'
import { MongoClient } from 'mongodb'

/**
 * @type {Record<string, Promise<Instance>>}
 */
const INSTANCES = {}

export class Client extends Connector {
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
   * The calls this component has made good on, absent unless it declares `once` anywhere.
   * Created eagerly beside the entity collection, for the reason the outbox's is.
   *
   * @public
   * @type {import('mongodb').Collection | undefined}
   */
  inbox

  /**
   * Whether this deployment can run transactions at all. A standalone mongod cannot, and an
   * outbox without atomicity is worse than none, so the storage falls back to inline emission.
   *
   * @public
   * @type {boolean}
   */
  transactional = false

  /**
   * The database this component's collections live in, which is where the migration state
   * is kept as well.
   *
   * @public
   * @type {import('mongodb').Db}
   */
  db

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
   * @private
   * @type {boolean}
   */
  claims

  /**
   * @param {Locator} locator
   * @param {boolean} [publishes] whether this component publishes anything
   * @param {boolean} [claims] whether any of its operations declares `once`
   */
  constructor(locator, publishes = false, claims = false) {
    super()

    this.locator = locator
    this.name = locator.lowercase
    this.publishes = publishes
    this.claims = claims
  }

  /**
   * @protected
   * @override
   * @return {Promise<void>}
   */
  async open() {
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

    this.db = db
    this.collection = await collection(db, this.name)
    this.transactional = await transactional(db)

    /*
     * The outbox may fall back and this may not: inline emission still delivers, where a call
     * that is not recorded is a call that will be made twice, which is the opposite of what was
     * asked for. So this refuses rather than warns.
     */
    if (this.claims) {
      if (!this.transactional)
        throw new Error(
          `Component '${this.name}' declares 'once', which needs a MongoDB replica set ` +
            'or a sharded cluster to commit a call with the entity it changed'
        )

      this.inbox = await collection(db, this.name + INBOX)
    }

    if (!this.publishes) return

    if (this.transactional) this.outbox = await collection(db, this.name + OUTBOX)
    else
      console.warn(
        'MongoDB is not a replica set; events are emitted inline, without an outbox',
        { collection: this.name }
      )
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
  async transaction(fn) {
    return this.instance.client.withSession(async (session) =>
      session.withTransaction(async () => fn(session))
    )
  }

  /**
   * @protected
   * @override
   * @return {Promise<void>}
   */
  async close() {
    /*
     * What was never counted is not discounted. An `open` that threw between taking the
     * instance and incrementing it leaves the count one high, and a client nothing ever
     * closes — which a process that is taken down and built again, as a halt does, would
     * otherwise leak once per cycle.
     */
    if (this.instance === undefined) return

    const instance = this.instance

    this.instance = undefined

    instance.count--

    if (instance.count === 0) {
      await instance.client.close()

      // another `open` may have taken it in the meantime, and that one is not this one
      if ((await INSTANCES[this.key]) === instance) delete INSTANCES[this.key]
    }
  }

  /**
   * @private
   * @param {string[]} urls
   * @return {Promise<Instance>}
   */
  async createInstance(urls) {
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
  async resolveURLs() {
    // Toa's own development stack is not on the conventional ports: the applications built on
    // Toa are, and they share the machine. See CONTRIBUTING.md.
    if (environment.get('TOA_DEV') === '1') {
      return ['mongodb://developer:secret@localhost:31020']
    } else {
      return await resolve(ID, this.locator.id)
    }
  }

  /**
   * @private
   * @return {string}
   */
  resolveDB() {
    const context = environment.get('TOA_CONTEXT')

    if (context !== undefined) return context

    if (environment.get('TOA_DEV') === '1') return 'toa-dev'

    throw new Error('Environment variable TOA_CONTEXT is not defined')
  }
}

function getKey(db, urls) {
  return db + ':' + urls.sort().join(' ')
}

/**
 * Concurrent pods race to create the same collection, and losing that race is not an error.
 */
async function collection(db, name) {
  try {
    return await db.createCollection(name)
  } catch (e) {
    if (e.code !== ALREADY_EXISTS) throw e

    return db.collection(name)
  }
}

async function transactional(db) {
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
const INBOX = '_inbox'
