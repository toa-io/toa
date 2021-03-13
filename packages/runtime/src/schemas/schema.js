'use strict'

class Schema {
  /**
   * Ajv's validate
   * @type function
   */
  #validate

  compile (validate) {
    this.#validate = validate
  }

  fit (value) {
    let oh
    const ok = this.#validate(value)

    if (!ok) oh = this.#error()

    return { ok, oh }
  }

  defaults () {
    const defaults = {}

    this.#validate(defaults)

    return defaults
  }

  #error () {
    // noinspection JSUnresolvedFunction
    const error = {
      message: this.#validate.error(),
      payload: this.#validate.errors.map(Schema.#format)
    }

    return error
  }

  static #format (error) {
    const result = {
      keyword: error.keyword,
      property: undefined,
      message: error.message
    }

    if (error.dataPath) result.property = error.dataPath.slice(1)
    else if (error.keyword === 'required') result.property = error.params.missingProperty
    else if (error.keyword === 'additionalProperties') result.property = error.params.additionalProperty

    return result
  }
}

exports.Schema = Schema
