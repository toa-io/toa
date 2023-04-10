'use strict'

/** @type {toa.pointer.uris.Resolver} */
const resolve = (locator, uris) => {
  const keys = [locator.id, locator.namespace, 'default']
  const entry = keys.find((key) => key in uris)
  const uri = uris[entry]

  if (entry === undefined) throw new Error(`URI annotation for '${locator.id}' is not found`)

  const url = new URL(uri)

  if (url.hostname === '') throw new Error(`URI annotation for '${locator.id}' must contain a hostname`)

  return { url, entry }
}

exports.resolve = resolve
