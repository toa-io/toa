'use strict'

const get = require('./.pointer')

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
    const dev = process.env.TOA_DEV === '1'
    const url = dev ? get.local(options.protocol) : get.env(prefix, locator)

    this.protocol = url.protocol
    this.hostname = url.hostname
    this.port = Number(url.port)
    this.path = url.pathname
    this.username = url.username
    this.password = url.password
    this.reference = url.href
    this.label = get.label(url)
  }
}

exports.Pointer = Pointer
