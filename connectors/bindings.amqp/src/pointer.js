'use strict'

const { Pointer: Base } = require('@toa.io/libraries/connectors')

const { PREFIX } = require('./constants')

// noinspection JSClosureCompilerSyntax
/**
 * @implements {toa.amqp.Pointer}
 */
class Pointer extends Base {
  /**
   * @param {toa.core.Locator} locator
   */
  constructor (locator) {
    super(locator, 'amqp:', OPTIONS)
  }
}

/** @type {toa.connectors.pointer.Options} */
const OPTIONS = {
  path: '/',
  prefix: PREFIX
}

exports.Pointer = Pointer
