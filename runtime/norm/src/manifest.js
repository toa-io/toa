import { existsSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, parse, relative, sep } from 'node:path'

import { Locator } from '@toa.io/core'
import { find } from '@toa.io/generic'

/**
 * A normalised manifest, as it is carried in a file beside the component it is of.
 *
 * A build normalises every component to tag its image; the process that runs it normalised them
 * again at start, reading every operation module's source through its bridge to do it. What the
 * build derived is written instead, and the two cannot disagree: the sources it was read from are
 * what the image's tag digests, and the version of Toa that read them is in that tag as well.
 *
 * What cannot be carried is where things are. A workspace and an image put a component in one
 * directory and Toa's own packages in another, so every path is written as what it is of rather
 * than as where it was — the component itself, or the package that holds it — and is resolved
 * again on the other side, the way norm resolved it.
 *
 * A key with no value is not carried: a file has no way to say `undefined`, and nothing reads
 * one apart from a key that is not there.
 */
export function plain(manifest) {
  const { locator, packages, path, ...rest } = manifest

  // what is carried is written, not the manifest the caller goes on using, and it is written
  // as a file holds it: a key with no value does not survive and is not meant to
  const declared = JSON.parse(JSON.stringify(rest))

  walk(declared, (item) => {
    item.path = carried(item.path, path)
  })

  local(declared, path)

  return declared
}

/** What `plain` wrote, read back beside the component it is of. */
export function revive(declared, path) {
  const manifest = { ...structuredClone(declared), path }

  walk(manifest, (item) => {
    item.path = resolved(item.path, path)
  })

  manifest.locator = new Locator(manifest.name, manifest.namespace)

  return manifest
}

/**
 * Everything in a manifest that says where a module of it is: what an inherited one declares is
 * in the prototype it came from, and what the component declares is in the component.
 */
function walk(manifest, rewrite) {
  for (const property of ROOTED)
    for (const item of Object.values(manifest[property] ?? {}))
      if (item.path !== undefined) rewrite(item)

  for (let prototype = manifest.prototype; prototype != null; prototype = prototype.prototype)
    if (prototype.path !== undefined) rewrite(prototype)
}

/** Where it is written. A workspace has none: it is a build's output, read by a process. */
export const NORMALIZED = 'manifest.toa.json'

/** Where norm says a module is, beside what it says about it. */
const ROOTED = ['events', 'receivers', 'guards']

/** The component's own directory, which is where it is read back. */
const SELF = '.'

function carried(path, root) {
  if (path === root) return SELF
  if (path.startsWith(root + sep)) return SELF + '/' + relative(root, path).split(sep).join('/')

  return specifier(path)
}

function resolved(path, root) {
  if (path === SELF) return root
  if (path.startsWith(SELF + '/')) return join(root, path.slice(2))

  return find(path, root, MANIFEST)
}

/**
 * A directory in a package, named the way a manifest would name it, so that it is found again
 * wherever the package is installed. A prototype that is a directory of the application's own is
 * refused here rather than in the container: an image carries components and nothing between
 * them, so nothing would be there to find, whether it is normalised here or there.
 */
function specifier(path) {
  const root = above(path)

  if (root !== undefined) {
    const { name, private: hidden } = JSON.parse(
      readFileSync(join(root, 'package.json'), 'utf8')
    )

    if (name !== undefined && hidden !== true)
      return [name, ...relative(root, path).split(sep)].filter(Boolean).join('/')
  }

  throw new Error(
    `'${path}' is in no package, so an image cannot carry what is in it: ` +
      'what a component inherits is reached by the reference of the package it is in.'
  )
}

/** The directory of the package a path is in. */
function above(path) {
  const { root } = parse(path)

  let current = path

  while (current !== root) {
    if (existsSync(join(current, 'package.json'))) return current

    current = dirname(current)
  }

  return undefined
}

/**
 * Nothing that is carried may say where it was on the machine that read it. What is checked is
 * what can be told apart from a value of the application's own — an HTTP route is `/accounts`
 * and is a path to nobody — so: anything inside the component, and any directory a manifest
 * declares a component or a prototype in. This is what catches a path norm starts writing
 * somewhere this file does not know about, at the build rather than at the start of a container
 * that cannot find it.
 */
function local(value, root, at = '') {
  if (typeof value === 'string') {
    if (value === root || value.startsWith(root + sep) || component(value))
      throw new Error(`'${at}' carries a path of the machine that read it: ${value}`)

    return
  }

  if (value === null || typeof value !== 'object') return

  for (const [key, item] of Object.entries(value))
    local(item, root, at === '' ? key : `${at}.${key}`)
}

/** Whether a value is a directory a component or a prototype is declared in. */
function component(value) {
  return isAbsolute(value) && existsSync(join(value, MANIFEST))
}

const MANIFEST = 'manifest.toa.yaml'
