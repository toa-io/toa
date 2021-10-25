'use strict'

const { Client } = require('../../connectors/storages.mongodb/src/client')

const connect = async (id) => {
  const [domain, name] = id.split('.')
  const client = new Client('', domain, name)

  await client.connect()

  return client
}

exports.connect = connect
