import Ajv from 'ajv'

/**
 * JSON Schema validator for states and inputs
 */
export default class Schema {
  static DEFAULTS = { type: 'object', additionalProperties: false }
  static OPTIONS = { useDefaults: true }

  #validate

  /**
   * @param schema {Object} - JSON Schema
   */
  constructor (schema) {
    if (schema.type && schema.type !== 'object') { throw new Error('State/input schemas must be an object type') }

    const Ctor = Ajv.default // avoid code style errors
    const ajv = new Ctor(Schema.OPTIONS)
    const declaration = { ...Schema.DEFAULTS, ...schema }

    this.#validate = ajv.compile(declaration)
  }

  /**
   * Validate object and modify with defaults
   * @param object {Object} - Input object
   * @returns {boolean} Validation result
   */
  fit (object) {
    const valid = this.#validate(object)

    return valid
  }
}
