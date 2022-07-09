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
        const variables = ['username', 'password', 'protocol', 'port']
        const values = env(options.prefix, locator, variables)

        for (const variable of variables) if (values[variable] !== undefined) url[variable] = values[variable]
      }
    }

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
 * @param {string} scope
 * @param {toa.core.Locator} locator
 * @param {string[]} variables
 * @returns {{ [key: string]: string }}
 */
const env = (scope, locator, variables) => {
  const values = {}
  const suffix = up(scope)
  const prefix = `TOA_${suffix}_${locator.uppercase}_`

  for (const variable of variables) {
    const key = prefix + up(variable)

    values[variable] = process.env[key]
  }

  return values
}

exports.Pointer = Pointer
