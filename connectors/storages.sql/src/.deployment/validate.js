'use strict'

/**
 * @param {toa.pointer.URIs} uris
 * @returns {void}
 */
const validate = (uris) => {
  if (uris === undefined || uris === null) throw new Error('SQL annotation is required')

  if (typeof uris !== 'string' && typeof uris !== 'object') {
    throw new Error('SQL annotation must be a string or an object')
  }

  if (typeof uris === 'string') test('default', uris)
  else for (const [key, value] of Object.entries(uris)) test(key, value)
}

/**
 * @param {string} key
 * @param {string} value
 * @returns {void}
 */
const test = (key, value) => {
  const error = (message) => { throw new Error(`SQL annotation '${key}' ${message}`) }
  const url = new URL(value)

  if (url.pathname === '') error('must contain path')

  const common = !key.includes('.')
  const [, database, schema, table] = url.pathname.split('/')

  if (database === '') error('database name must not be empty')
  if (common && table !== undefined) error('must not contain table name')
  if (key === 'default' && schema !== undefined) error('must not contain schema name')
}

exports.validate = validate
