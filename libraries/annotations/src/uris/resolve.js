'use strict'

/** @type {toa.annotations.uris.Resolver} */
const resolve = (uris, locator) => {
  /** @type {string} */

  let uri = uris[locator.namespace]?.[locator.name]

  if (uri === undefined && typeof uris[locator.namespace] === 'string') uri = uris[locator.namespace]
  if (uri === undefined) uri = uris.default
  if (uri === undefined) throw new Error(`URI annotation for '${locator.id}' not found`)

  return new URL(uri)
}

exports.resolve = resolve
