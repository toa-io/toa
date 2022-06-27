'use strict'

const { concat } = require('@toa.io/libraries/generic')

// noinspection JSClosureCompilerSyntax
/**
 * @implements {toa.core.Locator}
 */
class Locator {
  name
  namespace

  id
  label
  uppercase

  /**
   * @param {string} name
   * @param {string} namespace
   */
  constructor (name, namespace) {
    if (name === undefined || namespace === undefined) {
      throw new TypeError('Locator name and namespace must be defined')
    }

    this.name = name
    this.namespace = namespace

    this.id = namespace + '.' + name
    this.label = namespace + '-' + name
    this.uppercase = (namespace + '_' + name).toUpperCase()
  }

  hostname (type) {
    return concat(type, '-') + this.label
  }
}

exports.Locator = Locator
