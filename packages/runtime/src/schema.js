import Ajv from 'ajv'

/**
 * JSON Schema validator for states and inputs
 */
export default class Schema {
  static DEFAULTS = { additionalProperties: false }
  static OPTIONS = { useDefaults: true }

  #validate

  /**
   * @param schema {Object}
   */
  constructor (schema) {
    // noinspection JSPotentiallyInvalidConstructorUsage
    const ajv = new Ajv.default(Schema.OPTIONS) // eslint-disable-line new-cap
    const declaration = { ...Schema.DEFAULTS, ...schema }
    this.#validate = ajv.compile(declaration)
  }

  /**
   * @param object {Object}
   * @returns {boolean}
   */
  fit (object) {
    const valid = this.#validate(object)

    return valid
  }
}
