import assert from 'node:assert'
import { gunzipSync } from 'node:zlib'
import { readFile } from 'node:fs/promises'
import * as core from '@toa.io/core'

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
 * What this process composes, which it knows from the sources it booted from. What the map
 * states wins: two compositions of one locator run in one process while a rollout is staged,
 * and the map is what says which of them a caller is held to.
 *
 * @type {Record<string, import('@toa.io/core').Contract>}
 */
let composed = {}

/**
 * @param {string | Record<string, import('@toa.io/core').Contract> | undefined} value the file, or the map itself
 */
export const use = (value) => {
  source = value
}

/**
 * Forgets what this process composed, which is what a test does between one composition and
 * the next: a component that is no longer composed is one nothing states.
 */
export const forget = () => {
  composed = {}
}

/**
 * What this process composes, stated by the boot that composes it — and held to the map it was
 * given a file of, which one `toa deploy` writes with the images it deploys: the two differ only
 * where the map was not written again. What a test states instead is what that test means, and
 * is not checked.
 *
 * @param {toa.norm.Component[]} manifests
 * @returns {Promise<void>}
 */
export const compose = async (manifests) => {
  const file = typeof source === 'string' ? await read(source) : undefined

  for (const manifest of manifests) {
    const stated = file?.[manifest.locator.id]

    assert.ok(
      stated === undefined || stated.version === manifest.version,
      `'${manifest.locator.id}' is composed at a version the component map does not state. ` +
        'Run `toa map`.'
    )

    composed[manifest.locator.id] = core.contract.component(manifest)
  }
}

/**
 * What a component provides: what the map states of it, or what this process composes.
 *
 * @param {string} id
 * @returns {Promise<import('@toa.io/core').Contract | undefined>}
 */
export const contract = async (id) => {
  if (source === undefined) return composed[id]
  if (typeof source !== 'string') return source[id] ?? composed[id]

  return (await read(source))[id] ?? composed[id]
}

/**
 * A map is read gzipped where it is deployed and plain where it is not, so what it is is told by
 * its first two bytes rather than by its name.
 *
 * @param {string} path
 * @returns {Promise<Record<string, import('@toa.io/core').Contract>>}
 */
async function read(path) {
  let contents

  try {
    contents = await readFile(path)
  } catch (cause) {
    throw new Error(`Cannot read the component map '${path}'`, { cause })
  }

  try {
    if (contents[0] === 0x1f && contents[1] === 0x8b) contents = gunzipSync(contents)
  } catch (cause) {
    throw new Error(`The component map '${path}' is not readable gzip`, { cause })
  }

  try {
    return JSON.parse(contents.toString('utf8'))
  } catch (cause) {
    throw new Error(`The component map '${path}' is not JSON`, { cause })
  }
}
