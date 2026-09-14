import { readFile } from 'node:fs/promises'

/**
 * Which version of a component this process asks what that component provides.
 *
 * Held as the file it was given rather than as what the file said, and read at every lookup: a
 * deployment rewrites it under a running process, and a process may first call a peer long after
 * that peer was replaced. A lookup happens once per peer, so this is a read per peer.
 *
 * @type {string | Record<string, string> | undefined}
 */
let source

/**
 * @param {string | Record<string, string> | undefined} value the file, or the map itself
 */
export const use = (value) => {
  source = value
}

/**
 * The version of a component, where this process was given a map that names one. Absent, a
 * lookup goes to the name every version of that component serves.
 *
 * @param {string} id
 * @returns {Promise<string | undefined>}
 */
export const version = async (id) => {
  if (source === undefined) return undefined
  if (typeof source !== 'string') return source[id]

  return (await read(source))[id]
}

/**
 * @param {string} path
 * @returns {Promise<Record<string, string>>}
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
