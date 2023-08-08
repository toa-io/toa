'use strict'

const { resolve } = require('@toa.io/pointer')
const { Communication } = require('./communication')

const connector = (id, selector) => {
  const urls = resolve(id, selector)

  return new Communication(urls)
}

exports.connector = connector
