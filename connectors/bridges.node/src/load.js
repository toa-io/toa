import { basename, extname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import glob from 'fast-glob'

const operation = (root, name) => load(root, OPERATIONS_DIRECTORY, name)
const event = (root, name) => load(root, EVENTS_DIRECTORY, name)
const receiver = (root, name) => load(root, RECEIVERS_DIRECTORY, name)
const guard = (root, name) => load(root, GUARDS_DIRECTORY, name)

const scan = (directory) => async (root) => {
  const modules = await find(root, directory)

  return await Promise.all(Array.from(modules,
    async ([name, path]) => [name, await read(path)]))
}

/** A component's modules by name, whatever extension each was written with. */
async function find (root, directory) {
  const paths = await glob(resolve(root, directory, '*' + EXTENSIONS), GLOB)

  return new Map(paths.map((path) => [basename(path, extname(path)), path]))
}

async function load (root, directory, name) {
  const modules = await find(root, directory)
  const path = modules.get(name)

  if (path === undefined)
    throw new Error(`Component at '${root}' has no ${directory}/${name}`)

  return await read(path)
}

/**
 * A component may be written as either kind of module. Importing a CommonJS one
 * gives its `module.exports` as the default, alongside whatever named exports
 * Node can see, so what a module means is the same either way.
 */
async function read (path) {
  const namespace = await import(pathToFileURL(path).href)

  return shape(namespace)
}

/** What a module exports, whether it says so by name or as a default. */
function shape (namespace) {
  const named = Object.keys(namespace).filter((key) => key !== 'default' && key !== '__esModule')

  return named.length === 0 && namespace.default !== undefined ? namespace.default : namespace
}

const EXTENSIONS = '.{js,mjs,cjs}'
const EVENTS_DIRECTORY = 'events'
const RECEIVERS_DIRECTORY = 'receivers'
const OPERATIONS_DIRECTORY = 'operations'
const GUARDS_DIRECTORY = 'guards'
const RC_DIRECTORY = 'rc'

const GLOB = { onlyFiles: true, absolute: true }

export const operations = scan(OPERATIONS_DIRECTORY)
export const events = scan(EVENTS_DIRECTORY)
export const receivers = scan(RECEIVERS_DIRECTORY)
export const guards = scan(GUARDS_DIRECTORY)
export const rcs = scan(RC_DIRECTORY)

export { operation, event, receiver, guard }
