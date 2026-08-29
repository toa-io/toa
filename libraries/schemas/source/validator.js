'use strict'

const { default: Ajv } = require('ajv/dist/2019')
const formats = /** @type {Function} */ require('ajv-formats')

/**
 * Compiling a schema is the bulk of the time a composition spends booting, and the same
 * schema arrives here many times over: an operation's contract is compiled by the component
 * that owns it and again by every remote that calls it. Identical input yields an identical
 * validator, so it is compiled once and kept.
 *
 * A validator is stateless apart from `.errors`, which is read synchronously right after the
 * call it belongs to, so sharing one between call sites is safe.
 *
 * @param {object} schema
 * @param {object} [options]
 * @returns {import('ajv').ValidateFunction}
 */
function create (schema, options) {
  const key = JSON.stringify(schema) + '\u0000' + JSON.stringify(options ?? null)
  const cached = COMPILED.get(key)

  if (cached !== undefined) {
    // refresh the recency of the entry
    COMPILED.delete(key)
    COMPILED.set(key, cached)

    return cached
  }

  const validate = ajv(undefined, options).compile(schema)

  COMPILED.set(key, validate)

  // components discovered at runtime keep adding schemas, so the cache is bounded
  if (COMPILED.size > LIMIT)
    COMPILED.delete(COMPILED.keys().next().value)

  return validate
}

let VALIDATOR

function is (schema) {
  VALIDATOR ??= ajv()

  return VALIDATOR.validateSchema(schema) === true
}

/** @type {Map<string, import('ajv').ValidateFunction>} least recently used first */
const COMPILED = new Map()

const LIMIT = 4096

/**
 * @param {object[]} [schemas]
 * @param {object} [additional]
 */
function ajv (schemas, override = {}) {
  const options = Object.assign({ schemas }, OPTIONS, override)
  const ajv = new Ajv(options)

  formats(ajv)

  return ajv
}

const OPTIONS = {
  useDefaults: true,
  coerceTypes: true,
  strictTypes: false // omit warning: missing type "object"
}

exports.create = create
exports.is = is
exports.ajv = ajv
