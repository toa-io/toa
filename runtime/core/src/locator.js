'use strict'

const { concat } = require('@toa.io/libraries/generic')

// noinspection JSClosureCompilerSyntax
/**
 * @implements {toa.core.Locator}
 */
class Locator {
  namespace = 'system'
  name
  id
  label
  uppercase

  constructor (component) {
    if (component !== undefined) {
      if (typeof component === 'string') component = Locator.parse(component)

      this.namespace = component.namespace
      this.name = component.name
    }

    this.id = `${this.namespace}${concat('.', this.name)}`
    this.label = `${this.namespace}${concat('-', this.name)}`
    this.uppercase = this.namespace?.toUpperCase() + (this.name === undefined ? '' : '_' + this.name.toUpperCase())
  }

  host (type, level = 1) {
    let host = this.namespace

    if (type !== undefined) host = type + '-' + host
    if (level === 1 && this.name !== undefined) host += '-' + this.name

    return host
  }

  static parse (label) {
    const [namespace, name, ...rest] = label.split('.')

    return { namespace, name, endpoint: rest.join('.') }
  }
}

exports.Locator = Locator
