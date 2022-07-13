'use strict'

/** @type {toa.connectors.uris.Resolver} */
const resolve = (locator, uris) => {
  /** @type {string} */

  let uri = uris[locator.id]

  if (uri === undefined && typeof uris[locator.namespace] === 'string') uri = uris[locator.namespace]
  if (uri === undefined) uri = uris.default
  if (uri === undefined) throw new Error(`URI annotation for '${locator.id}' is not found`)

  return new URL(uri)
}

exports.resolve = resolve
