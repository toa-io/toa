import { resolve } from 'path'
import { readFileSync } from 'node:fs'
import { yaml } from '@toa.io/generic'

export const query = read(resolve(import.meta.dirname, './query.yaml'))
export const error = read(resolve(import.meta.dirname, './error.yaml'))
export const source = read(resolve(import.meta.dirname, './source.yaml'))

function read (path) {
  return yaml.load(readFileSync(path, 'utf8'))
}
