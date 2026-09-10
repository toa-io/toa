import { console } from 'openspan'

/**
 * The indexes the runtime keeps on collections of its own — the outbox's and the inbox's. They
 * are declared in code rather than in a migration a component would have to write, so making
 * and pruning them is the same job in both places and is written once.
 */

/**
 * The name of one of these is fixed, so changing what it is made of — a retention that changes
 * `expireAfterSeconds`, say — leaves that name held by an index of the old shape, which MongoDB
 * refuses to overwrite. The old one is dropped and the declared one made.
 *
 * @param {import('mongodb').Collection} collection
 * @param {object} fields
 * @param {object} options
 */
export async function index(collection, fields, options) {
  try {
    await collection.createIndex(fields, options)
  } catch (e) {
    if (!CONFLICTS.includes(e.code))
      return console.warn('MongoDB index creation failed', {
        collection: collection.collectionName,
        name: options.name,
        error: e
      })

    console.info('Recreating an index whose declaration changed', {
      collection: collection.collectionName,
      name: options.name
    })

    await drop(collection, options.name)
    await collection.createIndex(fields, options)
  }
}

/**
 * Removes what this collection carries that is no longer declared, so that a change to what the
 * runtime wants does not leave the shape it wanted before in place forever.
 *
 * @param {import('mongodb').Collection} collection
 * @param {string[]} desired the names that are declared
 */
export async function prune(collection, desired) {
  let current

  try {
    current = await collection.listIndexes().toArray()
  } catch {
    return
  }

  const obsolete = current
    .map(({ name }) => name)
    .filter((name) => name !== '_id_' && !desired.includes(name))

  if (obsolete.length === 0) return

  console.info('Removing obsolete indexes', {
    collection: collection.collectionName,
    indexes: obsolete.join(', ')
  })

  await Promise.all(obsolete.map((name) => drop(collection, name)))
}

/**
 * Concurrent replicas prune the same index, and losing that race is not an error.
 *
 * @param {import('mongodb').Collection} collection
 * @param {string} name
 */
async function drop(collection, name) {
  try {
    await collection.dropIndex(name)
  } catch (e) {
    if (e.code !== ERR_INDEX_NOT_FOUND) throw e
  }
}

const ERR_INDEX_NOT_FOUND = 27
const CONFLICTS = [85, 86] // IndexOptionsConflict, IndexKeySpecsConflict
