'use strict'

const { echo } = require('@toa.io/generic')
const { Connector } = require('@toa.io/core')

class Permissions extends Connector {
  /** @type {RegExp[]} */
  #allowances = []

  /** @type {RegExp[]} */
  #denials = []

  #resolve

  constructor (resolve) {
    super()

    this.#resolve = resolve
  }

  async open () {
    const { properties } = await this.#resolve()

    if (properties !== undefined) this.#parse(properties)
  }

  test (url) {
    const denial = this.#denials.findIndex((regexp) => regexp.test(url))

    if (denial !== -1) return false

    const allowance = this.#allowances.findIndex((regexp) => regexp.test(url))

    return allowance !== -1
  }

  #parse (properties) {
    if ('null' in properties) {
      const always = /** @type {RegExp} */ { test: () => true }

      this.#addRule(always, properties.null)
      delete properties.null
    }

    for (const [key, rule] of Object.entries(properties)) {
      const match = key.match(EXPRESSION)

      if (match === null) throw new Error(`'${key}' is not a regular expression`)

      const expression = echo(match.groups.expression)
      const regex = new RegExp(expression)

      this.#addRule(regex, rule)
    }
  }

  /**
   * @param {RegExp} regex
   * @param {boolean} rule
   */
  #addRule (regex, rule) {
    const rules = rule ? this.#allowances : this.#denials

    rules.push(regex)
  }
}

const EXPRESSION = /^\/(?<expression>.+)\/$/

exports.Permissions = Permissions
