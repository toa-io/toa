'use strict'

const { concat } = require('@toa.io/generic')

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
   * @param {string} [namespace]
   */
  constructor (name, namespace) {
    if (name === undefined) throw new TypeError('Locator name must be defined')

    this.name = name
    this.namespace = namespace

    this.id = concat(namespace, '.') + name
    this.label = (concat(namespace, '-') + name).toLowerCase()
    this.uppercase = (concat(namespace, '_') + name).toUpperCase()
  }

  hostname (prefix) {
    return concat(prefix?.toLowerCase(), '-') + this.label
  }

  /**
   * @param {string} string
   * @returns {Locator}
   */
  static parse (string) {
    const [namespace, name] = string.split(DOT)

    if (name === undefined) return new Locator(namespace)
    else return new Locator(name, namespace)
  }
}

const DOT = '.'

exports.Locator = Locator
