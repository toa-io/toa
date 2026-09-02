import { resolve } from 'path'
import { readFileSync } from 'node:fs'
import { load as parseYAML } from 'js-yaml'

export const query = read(resolve(import.meta.dirname, './query.yaml'))
export const error = read(resolve(import.meta.dirname, './error.yaml'))
export const source = read(resolve(import.meta.dirname, './source.yaml'))

function read (path) {
  return parseYAML(readFileSync(path, 'utf8'))
}
