'use strict'

const { lookup } = require('node:dns/promises')

/** @type {toa.dns.dedupe} */
const dedupe = async (inputs) => {
  const references = new Set()

  for (const input of inputs) {
    const ref = await resolve(input)

    references.add(ref)
  }

  return Array.from(references)
}

/**
 * @param {string} reference
 * @return {Promise<string>}
 */
async function resolve (reference) {
  const url = new URL(reference)
  const ip = await lookup(url.hostname)

  url.hostname = ip.address

  return url.href
}

exports.dedupe = dedupe
