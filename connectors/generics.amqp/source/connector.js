'use strict'

const { resolve } = require('@toa.io/pointer')
const { Communication } = require('./communication')

const connector = (id, locator) => {
  const urls = process.env.TOA_DEV === '1' ? [DEV_URL] : resolve(id, locator.id)

  return new Communication(urls)
}

const DEV_URL = 'amqp://developer:secret@localhost'

exports.connector = connector
