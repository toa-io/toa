'use strict'

const { Client } = require('../../connectors/storages.mongodb/src/client')

const connect = async (domain, entity) => {
  const client = new Client('', domain, entity)
  await client.connect()

  return client
}

exports.connect = connect
