'use strict'

const { Readable } = require('node:stream')
const { Err } = require('error-value')
const { match } = require('matchacho')

async function store (input, context) {
  const { storage, request, accept, trust } = input
  const path = request.url
  const claim = request.headers['content-type']
  const meta = parseMeta(request.headers['content-meta'])
  const body = await download(request, trust)

  if (body instanceof Error)
    return body

  return context.storages[storage].put(path, body, { claim, accept, meta })
}

/**
 * @param {string | string[] | undefined} values
 * @returns {Record<string, string>}
 */
function parseMeta (values) {
  const meta = {}

  if (values === undefined)
    return meta

  if (typeof values === 'string')
    values = values.split(',')

  for (const pair of values) {
    const eq = pair.indexOf('=')
    const key = (eq === -1 ? pair : pair.slice(0, eq)).trim()

    meta[key] = eq === -1 ? 'true' : pair.slice(eq + 1).trim()
  }

  return meta
}

/**
 * @param {Request} request
 * @param {Trust | undefined} trust
 * @return {import('node:stream').Readable | Error}
 */
async function download (request, trust) {
  /** @type {string | undefined} */
  const location = request.headers['content-location']

  if (location === undefined)
    return request

  const length = Number.parseInt(request.headers['content-length'])

  if (length !== 0)
    return ERR_LENGTH

  if (!trusted(location, trust))
    return ERR_UNTRUSTED

  const response = await fetch(location)

  if (!response.ok)
    return ERR_UNAVAILABLE

  return response.body === null ? ERR_UNAVAILABLE : Readable.fromWeb(
    /** @type {import('node:stream/web').ReadableStream} **/ response.body)

}

/**
 * @param {string} location
 * @param {Trust | undefined} trust
 * @return {boolean}
 */
function trusted (location, trust) {
  if (trust === undefined)
    return false

  const url = toURL(location)

  if (url === null)
    return false

  for (const permission of trust) {
    const ok = match(permission,
      String, (origin) => url.origin === origin,
      RegExp, (pattern) => pattern.test(url.origin))

    if (ok)
      return true
  }

  return false
}

function toURL (location) {
  try {
    return new URL(location)
  } catch (error) {
    return null
  }
}

const ERR_UNTRUSTED = Err('LOCATION_UNTRUSTED', 'Location is not trusted')
const ERR_LENGTH = Err('LOCATION_LENGTH', 'Content-Length must be 0 when Content-Location is used')
const ERR_UNAVAILABLE = Err('LOCATION_UNAVAILABLE', 'Location is not available')

exports.effect = store

/** @typedef {Array<string | RegExp>} Trust */
