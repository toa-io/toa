'use strict'

const { generate } = require('randomstring')

/** @type {Record<string, string>} */
const manifest = {
  [generate()]: 'https://toa.io',
  [generate()]: 'https://api.domain.com',
  [generate()]: 'amqp://localhost',
  [generate()]: 'amqps://localhost'
}

exports.manifest = manifest
