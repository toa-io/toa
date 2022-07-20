'use strict'

/**
 * @param {toa.pointer.URIs} uris
 */
const validate = (uris) => {
  Object.values(uris).forEach(check)
}

/**
 * @param {string} uri
 */
const check = (uri) => {
  const url = new URL(uri)

  if (url.hostname === '') throw new Error(`URI ${url.href} must contain a hostname`)
}

exports.validate = validate
