'use strict'

/**
 * @param {string} name
 * @returns {[string, string]}
 */
const parse = (name) => {
  const parts = name.split('.')
  const [operation, component, namespace] = parts.reverse()
  const id = namespace === undefined ? undefined : `${namespace}.${component}`

  return [id, operation]
}

exports.parse = parse
