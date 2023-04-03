'use strict'

/**
 * @param {URL} url
 * @returns {string}
 */
const label = (url) => {
  const safe = new URL(url.href)

  safe.password = ''

  return safe.href
}

exports.label = label
