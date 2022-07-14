'use strict'

const get = require('./.pointer')

// noinspection JSClosureCompilerSyntax
/**
 * @implements {toa.pointer.Pointer}
 */
class Pointer {
  protocol
  host
  port
  hostname
  path
  reference
  label

  /**
   * @param {string} prefix
   * @param {toa.core.Locator} locator
   * @param {toa.pointer.Options} options
   */
  constructor (prefix, locator, options) {
    const local = process.env.TOA_ENV === 'local'
    const url = local ? get.local(options.protocol) : get.env(prefix, locator)

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

exports.Pointer = Pointer
