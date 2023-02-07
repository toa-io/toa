'use strict'

const { IO } = require('./io')
const { Connection } = require('./connection')

/**
 * @param {string} url
 * @returns {Promise<toa.messenger.IO>}
 */
async function connect (url) {
  const connection = new Connection(url)

  await connection.connect()

  return new IO(connection)
}

exports.connect = connect
