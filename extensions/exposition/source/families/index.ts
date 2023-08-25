import { resolve } from 'node:path'
import { type Family } from '../Directives'

export function load (paths: string[] = []): Family[] {
  paths = paths.concat(builtin)

  return paths.map((path) => require(path))
}

const builtin = [
  resolve(__dirname, 'dev')
]
