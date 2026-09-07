import { readFile } from 'node:fs/promises'
import { sources } from './sources.js'
import { exports, type Exports } from './exports.js'
import { algorithm, type Definition } from './operations.js'

/**
 * What a component's modules declare, read from their source and never by importing them: a
 * deploy reads a component whose dependencies are not installed, and a booting process reads
 * the same, so the two cannot disagree.
 */
export async function operations(root: string): Promise<Record<string, Definition>> {
  const algorithms: Record<string, Definition> = {}

  for (const [name, exported, path] of await read(root, 'operations')) {
    const definition = algorithm(exported, path)

    if (definition !== null) algorithms[name] = definition
  }

  return algorithms
}

export async function events(root: string): Promise<Record<string, Event>> {
  const events: Record<string, Event> = {}

  for (const [name, exported] of await read(root, 'events'))
    events[name] = { conditioned: exported.has('condition'), subjective: exported.has('payload') }

  return events
}

export async function receivers(root: string): Promise<Record<string, Receiver>> {
  const receivers: Record<string, Receiver> = {}

  for (const [name, exported] of await read(root, 'receivers'))
    receivers[name] = { conditioned: exported.has('condition'), adaptive: exported.has('request') }

  return receivers
}

export async function guards(root: string): Promise<Record<string, object>> {
  const guards: Record<string, object> = {}

  for (const [name, exported] of await read(root, 'guards')) if (exported.has('guard')) guards[name] = {}

  return guards
}

async function read(root: string, directory: string): Promise<Array<[string, Exports, string]>> {
  const modules = await sources(root, directory)

  return Promise.all(
    [...modules].map(async ([name, path]): Promise<[string, Exports, string]> => [
      name,
      exports(path, await readFile(path, 'utf8')),
      path
    ])
  )
}

export interface Event {
  conditioned: boolean
  subjective: boolean
}

export interface Receiver {
  conditioned: boolean
  adaptive: boolean
}
