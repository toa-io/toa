'use strict'

// noinspection JSClosureCompilerSyntax
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
   * @param {toa.connectors.pointer.Options} [options]
   */
  constructor (locator, protocol, options) {
    const hostname = process.env.TOA_ENV === 'local' ? 'localhost' : locator.hostname(options?.prefix)
    const url = new URL(protocol + '//')

    url.host = hostname
    url.port = options?.port.toString()

    this.hostname = url.hostname
    this.protocol = url.protocol
    this.port = url.port
    this.reference = url.href
  }
}

exports.Pointer = Pointer
