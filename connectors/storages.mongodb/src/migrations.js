import { randomUUID } from 'node:crypto'
import { setTimeout as sleep } from 'node:timers/promises'

import { console } from 'openspan'

/**
 * Applies a component's migrations to its collection, in the order they were declared, and
 * records each one so that it is applied once for the database rather than once per replica.
 *
 * The record is also the lock: the row that says a migration ran is inserted before it runs,
 * and MongoDB refuses the second insert of the same `_id`. Nothing else is needed to make the
 * group agree, which is why this works where there is no Redis.
 */
export class Migrations {
  /** @type {import('mongodb').Collection} */
  #collection

  /** @type {import('mongodb').Collection} */
  #state

  /** @type {Array<{ id: string, steps: object[] }>} */
  #list

  /**
   * @param {import('mongodb').Db} db
   * @param {import('mongodb').Collection} collection the entity's own
   * @param {Array<{ id: string, steps: object[] }>} list
   */
  constructor(db, collection, list) {
    this.#collection = collection
    this.#state = db.collection(STATE)
    this.#list = list
  }

  /**
   * A migration is applied only after the one before it, because a later one is written
   * against what an earlier one leaves behind.
   */
  async run() {
    let applied = 0

    for (const migration of this.#list) if (await this.#apply(migration)) applied++

    // debug, because the ordinary start has nothing to report: every migration was applied
    // long ago by whoever started first. But a run that says nothing at all cannot be told
    // from one that never looked
    console.debug('Migrations checked', {
      collection: this.#collection.collectionName,
      declared: this.#list.length,
      applied
    })
  }

  /**
   * Answers whether this replica was the one that applied it.
   *
   * @private
   */
  async #apply(migration) {
    const id = `${this.#collection.collectionName}:${migration.id}`

    /** when the wait for another replica was last reported */
    let announced

    while (true) {
      if (await this.#claim(id)) {
        await this.#run(id, migration)

        return true
      }

      const row = await this.#state.findOne({ _id: id })

      // removed between the claim and the read; whoever did that wants it applied again
      if (row === null) continue

      if (row.state === DONE) {
        console.debug('Migration was applied already', { migration: id })

        return false
      }

      const stale = Date.now() - row.heartbeat.getTime() > LEASE

      if (!stale) {
        /*
         * The component does not serve until this returns, so a replica waiting here is a pod
         * that is simply not up, with nothing anywhere saying why. On its own cadence rather
         * than the poll's, which is a second.
         */
        if (announced === undefined || Date.now() - announced > PROGRESS) {
          announced = Date.now()

          console.info('Waiting for another replica to apply a migration', {
            migration: id,
            owner: row.owner
          })
        }

        await sleep(POLL)

        continue
      }

      console.warn('Taking over an abandoned migration', {
        migration: id,
        owner: row.owner,
        heartbeat: row.heartbeat
      })

      if (await this.#steal(id, row.heartbeat)) {
        await this.#run(id, migration)

        return true
      }
    }
  }

  /**
   * Writes the row that says this replica is applying the migration. Answers whether it won.
   *
   * @private
   */
  async #claim(id) {
    try {
      await this.#state.insertOne({
        _id: id,
        state: RUNNING,
        owner: OWNER,
        started: new Date(),
        heartbeat: new Date()
      })

      return true
    } catch (error) {
      if (error.code === ERR_DUPLICATE_KEY) return false

      throw error
    }
  }

  /**
   * Takes a claim whose owner stopped saying it was alive. The heartbeat it read is part of
   * the criteria, so only one of several waiting replicas takes it.
   *
   * @private
   */
  async #steal(id, heartbeat) {
    const result = await this.#state.updateOne(
      { _id: id, state: RUNNING, heartbeat },
      { $set: { owner: OWNER, heartbeat: new Date() } }
    )

    return result.modifiedCount === 1
  }

  /**
   * Applies the steps and marks the migration done. A step that throws leaves the row as it
   * is: the component does not start, and the next replica to reach a stale claim runs the
   * migration again from its first step.
   *
   * @private
   */
  async #run(id, migration) {
    const total = migration.steps.length
    const started = Date.now()

    console.info('Applying migration', { migration: id, steps: total })

    const beat = setInterval(() => {
      this.#state
        .updateOne({ _id: id }, { $set: { heartbeat: new Date() } })
        .catch((error) =>
          console.warn('Migration heartbeat failed', { migration: id, error })
        )
    }, HEARTBEAT)

    beat.unref?.()

    let applying = 0

    /*
     * A backfill takes as long as the collection is large, and every replica of the group waits
     * out the whole of it. On its own cadence rather than the heartbeat's, which is every five
     * seconds and would say this a dozen times a minute.
     */
    const progress = setInterval(() => {
      console.info('Migration is still being applied', {
        migration: id,
        step: applying,
        steps: total,
        elapsed: Date.now() - started
      })
    }, PROGRESS)

    progress.unref?.()

    try {
      for (const step of migration.steps) {
        applying++

        await this.#step(id, step)
      }

      await this.#state.updateOne(
        { _id: id },
        { $set: { state: DONE, completed: new Date() } }
      )
    } finally {
      clearInterval(beat)
      clearInterval(progress)
    }

    console.info('Migration applied', { migration: id, elapsed: Date.now() - started })
  }

  /** @private */
  async #step(id, step) {
    const verbs = Object.keys(step ?? {})

    if (verbs.length !== 1 || !(verbs[0] in STEPS))
      throw new Error(
        `Migration '${id}' has a step that is not one of ` +
          `${Object.keys(STEPS).join(', ')}: ${JSON.stringify(step)}`
      )

    await STEPS[verbs[0]](this.#collection, step[verbs[0]], id)
  }
}

/**
 * Creates the index the step declares. Where the name is held by an index of a different shape,
 * that one is dropped: the declaration is what the component is to run against, and refusing
 * to reconcile is what left a database diverged from its manifest before migrations existed.
 */
async function index(collection, { name, keys, ...rest }, id) {
  if (name === undefined || keys === undefined)
    throw new Error(`Migration '${id}' declares an index without a name or keys`)

  const spec = Object.fromEntries(
    Object.entries(keys).map(([field, direction]) => [
      field,
      DIRECTIONS[direction] ?? direction
    ])
  )

  const options = { name }

  for (const [key, value] of Object.entries(rest)) {
    if (!(key in OPTIONS))
      throw new Error(`Migration '${id}' declares an unknown index option '${key}'`)

    options[OPTIONS[key]] = value
  }

  try {
    await collection.createIndex(spec, options)
  } catch (error) {
    if (!CONFLICTS.includes(error.code)) throw error

    console.info('Recreating an index whose declaration changed', { index: name })

    await collection.dropIndex(name)
    await collection.createIndex(spec, options)
  }
}

async function dropIndex(collection, { name }, id) {
  if (name === undefined)
    throw new Error(`Migration '${id}' drops an index without a name`)

  try {
    await collection.dropIndex(name)
  } catch (error) {
    if (error.code !== ERR_INDEX_NOT_FOUND) throw error
  }
}

async function update(collection, { filter, update: changeset }, id) {
  if (changeset === undefined) throw new Error(`Migration '${id}' updates with nothing`)

  const result = await collection.updateMany(filter ?? {}, changeset)

  console.info('Migration updated records', {
    migration: id,
    records: result.modifiedCount
  })
}

async function remove(collection, { filter }, id) {
  if (filter === undefined)
    throw new Error(
      `Migration '${id}' deletes without a filter; pass {} to mean every record`
    )

  const result = await collection.deleteMany(filter)

  console.info('Migration deleted records', {
    migration: id,
    records: result.deletedCount
  })
}

const STEPS = { index, dropIndex, update, delete: remove }

const DIRECTIONS = { asc: 1, desc: -1, hash: 'hashed' }

/** what an index step may say, and what the driver calls it */
const OPTIONS = {
  unique: 'unique',
  sparse: 'sparse',
  partial: 'partialFilterExpression',
  ttl: 'expireAfterSeconds'
}

/**
 * A component's namespace may not be `system`, so this cannot be a component's own collection;
 * and MongoDB reserves the `system.` prefix, with a dot, which this is not.
 */
export const STATE = 'system_migrations'

const RUNNING = 'running'
const DONE = 'done'

/** how long a claim outlives its last heartbeat before another replica may take it */
const LEASE = 30_000
const HEARTBEAT = 5_000
const POLL = 1_000

/** how often a run that is taking its time says it is still going, and a wait that it is waiting */
const PROGRESS = 30_000

/**
 * Which process holds a claim, and nothing more: it is read by whoever takes an abandoned
 * one over, and told to whoever reads the collection. Random, because there is no identity
 * a process is guaranteed to have — a host name says nothing about two replicas on one
 * machine, and a pid is reused.
 */
const OWNER = randomUUID()

const ERR_DUPLICATE_KEY = 11000
const ERR_INDEX_NOT_FOUND = 27
const CONFLICTS = [85, 86] // IndexOptionsConflict, IndexKeySpecsConflict
