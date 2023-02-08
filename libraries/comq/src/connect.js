'use strict'

const { IO } = require('./io')
const { Connection } = require('./connection')

/** @type {toa.comq.connect} */
const connect = async (url) => {
  const connection = new Connection(url)

  await connection.connect()

  return new IO(connection)
}

exports.connect = connect
