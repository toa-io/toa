'use strict'

/** @type {toa.pointer.uris.Resolver} */
const resolve = (locator, uris) => {
  let entry

  /** @type {string} */
  let uri

  const entries = [locator.id, locator.namespace, 'default']

  for (const key of entries) {
    if (typeof uris[key] === 'string') {
      uri = uris[key]
      entry = key

      break
    }
  }

  if (uri === undefined) throw new Error(`URI annotation for '${locator.id}' is not found`)

  const url = new URL(uri)

  return { url, entry }
}

exports.resolve = resolve
