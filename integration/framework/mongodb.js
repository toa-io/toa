'use strict'

const { Client } = require('../../connectors/storages.mongodb/src/client')
const { Locator } = require('../../runtime/core/src/locator')

const connect = async (fqn) => {
  const { domain, name } = Locator.split(fqn)
  const client = new Client('', domain, name)
  await client.connect()

  return client
}

exports.connect = connect
