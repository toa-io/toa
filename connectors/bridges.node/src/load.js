import { basename, extname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import glob from 'fast-glob'

export const operation = (root, name) => load(root, OPERATIONS_DIRECTORY, name)
export const event = (root, name) => load(root, EVENTS_DIRECTORY, name)
export const receiver = (root, name) => load(root, RECEIVERS_DIRECTORY, name)
export const guard = (root, name) => load(root, GUARDS_DIRECTORY, name)

const scan = (directory) => async (root) => {
  const modules = await find(root, directory)

  return await Promise.all(Array.from(modules,
    async ([name, path]) => [name, await read(path)]))
}

/**
 * A component's modules by name, whatever extension each was written with.
 *
 * Two files that resolve to one name are a conflict rather than a race: which of them a scan
 * reached first is not something a component may depend on.
 */
async function find (root, directory) {
  const paths = await glob(resolve(root, directory, '*' + EXTENSIONS), GLOB)
  const modules = new Map()

  // sorted, so the two files a conflict names are the same two on every machine
  for (const path of paths.sort()) {
    const name = basename(path, extname(path))
    const found = modules.get(name)

    if (found !== undefined)
      throw new Error(`Component at '${root}' has more than one ${directory}/${name}: ` +
        `${basename(found)} and ${basename(path)}`)

    modules.set(name, path)
  }

  return modules
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
 *
 * TypeScript is read by Node itself, which erases the types and compiles nothing else. What it
 * refuses is named here, because its own message says neither which file it was reading nor
 * what to write instead.
 */
async function read (path) {
  let namespace

  try {
    namespace = await import(pathToFileURL(path).href)
  } catch (error) {
    if (error.code === ERASABLE)
      throw new Error(`${path}: ${error.message}. Types are erased, never compiled, so a ` +
        'component is written in erasable syntax only — no enum, no namespace, no parameter ' +
        'property.', { cause: error })

    if (error.code === PACKAGED)
      throw new Error(`${path}: Node does not erase types under 'node_modules'. A component ` +
        'a package ships is transpiled before it is published.', { cause: error })

    throw error
  }

  return shape(namespace)
}

/** What a module exports, whether it says so by name or as a default. */
function shape (namespace) {
  const named = Object.keys(namespace).filter((key) => key !== 'default' && key !== '__esModule')

  return named.length === 0 && namespace.default !== undefined ? namespace.default : namespace
}

const EXTENSIONS = '.{js,mjs,cjs,ts}'
const ERASABLE = 'ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX'
const PACKAGED = 'ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING'
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
