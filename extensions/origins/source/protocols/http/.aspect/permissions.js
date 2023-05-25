'use strict'

/**
 * @implements {toa.origins.http.Permissions}
 */
class Permissions {
  #default = process.env.TOA_DEV === '1'

  /** @type {RegExp[]} */
  #allowances = []

  /** @type {RegExp[]} */
  #denials = []

  /**
   * @param {toa.origins.http.Properties} properties
   */
  constructor (properties) {
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

      const regex = new RegExp(match.groups.expression)

      this.#addRule(regex, rule)
    }
  }

  /**
   * @param {RegExp} regex
   * @param {boolean} rule
   */
  #addRule (regex, rule) {
    if (rule === true) this.#allowances.push(regex)
    else this.#denials.push(regex)
  }
}

const EXPRESSION = /^\/(?<expression>.+)\/$/

exports.Permissions = Permissions
