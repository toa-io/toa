'use strict'

/**
 * @param {string} name
 * @param {string} [def]
 * @returns {[string, string]}
 */
const parse = (name, def) => {
  const parts = name.split('.')
  const [endpoint, component, namespace] = parts.reverse()
  const id = namespace === undefined ? def : namespace + '.' + component

  if (id !== undefined && def !== undefined && id !== def) {
    throw new Error(`Component id mismatch: '${id}' expected, '${component}' given`)
  }

  return [id, endpoint]
}

exports.parse = parse
