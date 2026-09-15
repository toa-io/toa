import { readFile } from 'node:fs/promises'

/**
 * What this process was given about the components it calls: the contract of the version each of
 * them runs.
 *
 * Held as the file it was given rather than as what the file said, and read at every call for
 * one: a deployment rewrites it under a running process, and a process may first call a peer
 * long after that peer was replaced. A contract is read once per peer, so this is a read per
 * peer.
 *
 * @type {string | Record<string, import('@toa.io/core').Contract> | undefined}
 */
let source

/**
 * @param {string | Record<string, import('@toa.io/core').Contract> | undefined} value the file, or the map itself
 */
export const use = (value) => {
  source = value
}

/**
 * What a component provides, where this process was given a map that states it.
 *
 * @param {string} id
 * @returns {Promise<import('@toa.io/core').Contract | undefined>}
 */
export const contract = async (id) => {
  if (source === undefined) return undefined
  if (typeof source !== 'string') return source[id]

  return (await read(source))[id]
}

/**
 * @param {string} path
 * @returns {Promise<Record<string, import('@toa.io/core').Contract>>}
 */
async function read(path) {
  let contents

  try {
    contents = await readFile(path, 'utf8')
  } catch (cause) {
    throw new Error(`Cannot read the component map '${path}'`, { cause })
  }

  try {
    return JSON.parse(contents)
  } catch (cause) {
    throw new Error(`The component map '${path}' is not JSON`, { cause })
  }
}
