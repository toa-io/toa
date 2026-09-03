import { CORE_SCHEMA, load as read, dump as write, mergeTag } from 'js-yaml'

/**
 * YAML 1.2 removed the `<<` merge key along with the rest of the 1.1 type library, and js-yaml
 * follows the spec author's recommendation in reading a document under the 1.2 core schema. It
 * left no replacement, though, and a manifest merges one mapping into another — so the tag goes
 * back, and nothing else does.
 *
 * The 1.1 booleans stay gone: `yes`, `no`, `on` and `off` are strings, as 1.2 states, and what
 * they were shorthand for is written `true` and `false`.
 */
const SCHEMA = CORE_SCHEMA.withTags(mergeTag)

/**
 * @param {string} text
 * @param {object} [options]
 * @returns {any}
 */
export function load (text, options) {
  return read(text, { schema: SCHEMA, ...options })
}

/**
 * Writing is left to js-yaml's own schema, which quotes a scalar that any YAML version could
 * read as something other than a string — `NO`, `yes`, `on`. Reading under the 1.2 core does not
 * need those quotes; a document this writes is read by parsers that do.
 *
 * @param {any} value
 * @param {object} [options]
 * @returns {string}
 */
export function dump (value, options) {
  return write(value, options)
}
