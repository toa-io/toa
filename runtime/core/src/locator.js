'use strict'

const { concat } = require('@toa.io/libraries/generic')

// noinspection JSClosureCompilerSyntax
/**
 * @implements {toa.core.Locator}
 */
class Locator {
  domain = 'system'
  name
  id
  label
  uppercase

  constructor (component) {
    if (component !== undefined) {
      if (typeof component === 'string') component = Locator.parse(component)

      this.domain = component.domain
      this.name = component.name
    }

    this.id = `${this.domain}${concat('.', this.name)}`
    this.label = `${this.domain}${concat('-', this.name)}`
    this.uppercase = this.domain.toUpperCase() + (this.name === undefined ? '' : '_' + this.name.toUpperCase())
  }

  host (type, level = 1) {
    let host = this.domain

    if (type !== undefined) host = type + '-' + host
    if (level === 1 && this.name !== undefined) host += '-' + this.name

    return host
  }

  static parse (label) {
    const [domain, name, ...rest] = label.split('.')

    return { domain, name, endpoint: rest.join('.') }
  }
}

exports.Locator = Locator
