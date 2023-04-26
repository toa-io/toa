'use strict'

require('ajv-formats')

/**
 * @param {string} value
 * @returns {object}
 */
function formats (value) {
  if (FORMATS.includes(value)) return { type: 'string', format: value }
  else return null
}

// ajv-formats
const FORMATS = ['date', 'time', 'date-time', 'duration', 'uri', 'uri-reference', 'uri-template', 'url', 'email', 'hostname', 'ipv4', 'ipv6', 'regex', 'uuid', 'json-pointer', 'json-pointer-uri-fragment', 'relative-json-pointer', 'byte', 'int32', 'int64', 'float', 'double', 'password', 'binary']

exports.formats = formats
