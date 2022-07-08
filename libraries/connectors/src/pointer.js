'use strict'

/**
 * @implements {toa.connectors.Pointer}
 */
class Pointer {
  protocol
  host
  port
  hostname
  reference

  /**
   * @param {toa.core.Locator} locator
   * @param {string} protocol
   * @param {string} [port]
   */
  constructor (locator, protocol, port) {
    const hostname = process.env.TOA_ENV === 'local' ? 'localhost' : locator.hostname()
    const url = new URL(protocol + '//')

    url.host = hostname
    url.port = port

    this.hostname = url.hostname
    this.protocol = url.protocol
    this.port = url.port
    this.reference = url.href
  }
}

exports.Pointer = Pointer
