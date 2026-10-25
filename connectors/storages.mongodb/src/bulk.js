import { MongoClientBulkWriteError, MongoServerError } from 'mongodb'

/**
 * The client's bulk write, where a command the server refused is thrown as the server sent it.
 *
 * The driver wraps that refusal in an error that carries none of its labels, and a transaction
 * runs again only what is labelled as worth running again: a write conflict with a commit in
 * flight would end the transaction as a failure of its own. A write the server refused one by
 * one is left as it is, read off `writeErrors`.
 *
 * @param {import('mongodb').MongoClient} client
 * @param {import('mongodb').AnyClientBulkWriteModel[]} operations
 * @param {import('mongodb').ClientBulkWriteOptions} options
 */
export async function bulkWrite(client, operations, options) {
  try {
    return await client.bulkWrite(operations, options)
  } catch (error) {
    if (
      error instanceof MongoClientBulkWriteError &&
      error.cause instanceof MongoServerError
    )
      throw error.cause
    else throw error
  }
}
