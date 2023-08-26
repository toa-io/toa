import { resolve } from 'node:path'
import { readdirSync } from 'node:fs'
import { type Family } from '../Directive'

export function load (paths: string[] = []): Family[] {
  paths = paths.concat(builtin)

  return paths.map((path) => require(path))
}

function list (): string[] {
  const entries = readdirSync(__dirname, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(entry.path, entry.name))
}

const builtin = list()
