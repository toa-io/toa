'use strict'

const { letters: { up } } = require('@toa.io/libraries/generic')

// noinspection JSClosureCompilerSyntax

/**
 * @implements {toa.connectors.Pointer}
 */
class Pointer {
  protocol
  host
  port
  hostname
  path
  reference

  /**
   * @param {toa.core.Locator} locator
   * @param {string} protocol
   * @param {toa.connectors.pointer.Options} [options]
   */
  constructor (locator, protocol, options = {}) {
    const url = new URL(protocol + '//')

    if (process.env.TOA_ENV === 'local') {
      url.hostname = 'localhost'
      url.username = 'developer'
      url.password = 'secret'
    } else {
      url.hostname = locator.hostname(options.prefix)

      if (options.prefix) {
        const { username, password } = credentials(options, locator)

        if (username !== undefined) url.username = username
        if (password !== undefined) url.password = password
      }
    }

    url.port = options.port?.toString()

    if (options.path !== undefined) url.pathname = options.path

    this.protocol = url.protocol
    this.hostname = url.hostname
    this.port = url.port
    this.path = url.pathname
    this.reference = url.href

    this.label = label(url)
  }
}

/**
 * @param {URL} url
 * @returns {string}
 */
const label = (url) => {
  const safe = new URL(url.href)

  safe.password = ''

  return safe.href
}

/**
 *
 * @param options
 * @param locator
 * @returns {{ username?: string, password?: string }}
 */
function credentials (options, locator) {
  const suffix = options.prefix ? up(options.prefix) + '_' : ''
  const prefix = `TOA_${suffix}${locator.uppercase}_`
  const username = env(prefix, 'USERNAME')
  const password = env(prefix, 'PASSWORD')

  return { username, password }
}

/**
 * @param {string} prefix
 * @param {string} name
 * @returns {string}
 */
const env = (prefix, name) => process.env[prefix + name]

exports.Pointer = Pointer
