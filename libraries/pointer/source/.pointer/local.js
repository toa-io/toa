'use strict'

/**
 * @param {string} protocol
 * @returns {URL}
 */
const local = (protocol) => {
  const url = new URL(protocol + '//')

  url.hostname = 'localhost'
  url.username = 'developer'
  url.password = 'secret'

  return url
}

exports.local = local
