import { CORE_SCHEMA, boolYaml11Tag, load as read, dump as write, mergeTag } from 'js-yaml'

/**
 * `<<` is a YAML 1.1 type, and 1.2 left it out of the core schema along with the rest of the
 * 1.1 type repository, so js-yaml stopped resolving it by default in version 5 — the key is
 * read as a key rather than merged. A manifest states it, so the tag is put back.
 *
 * `yes`, `no`, `on` and `off` are 1.1 booleans, and are put back with it.
 *
 * The whole 1.1 schema is not, because its integers come with it: `0755` is octal there and
 * `1:30` is ninety.
 */
const SCHEMA = CORE_SCHEMA.withTags(mergeTag, boolYaml11Tag)

/**
 * @param {string} text
 * @param {object} [options]
 * @returns {any}
 */
export function load (text, options) {
  return read(text, { schema: SCHEMA, ...options })
}

/**
 * @param {any} value
 * @param {object} [options]
 * @returns {string}
 */
export function dump (value, options) {
  return write(value, { schema: SCHEMA, ...options })
}
