'use strict'

const { Locator } = require('@toa.io/core')
const { Client } = require('../../connectors/storages.mongodb/src/client')

const connect = async (id) => {
  const locator = new Locator(id)
  const client = new Client(locator.host('mongodb'), locator.domain, locator.name)

  await client.connect()

  return client
}

exports.connect = connect
