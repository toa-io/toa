'use strict'

const { lookup } = require('node:dns/promises')

/** @type {toa.dns.dedupe} */
const dedupe = async (inputs) => {
  if (inputs.length === 0) return inputs

  const references = new Set()
  const output = []

  for (const input of inputs) {
    const ref = await resolve(input)

    if (!references.has(ref)) output.push(input)

    references.add(ref)
  }

  return output
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
