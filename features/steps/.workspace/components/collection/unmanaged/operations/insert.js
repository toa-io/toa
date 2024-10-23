'use strict'

const { randomUUID } = require('node:crypto')

async function unmanaged (input, collection, context) {
  // insert into a mongodb collection a document with
  const id = randomUUID().replace(/-/g, '')

  await collection.insertOne({ id, name: 'John Doe', age: 30 })

  return true
}

exports.unmanaged = unmanaged
