import path from 'path'
import url from 'url'

import { createRequire } from 'module'

import yaml from '../src/yaml'
const require = createRequire(import.meta.url)

export const dummiesPath = path.dirname(require.resolve('@kookaburra/dummies'))

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const loadExpectedManifest = async () => await yaml(path.resolve(__dirname, './expected.yaml'))

export const loadExpectedOperations = async () => {
  const operations = []

  operations.push({
    algorithm: require(path.resolve(dummiesPath, './simple/operations/transit')),
    name: 'transition',
    state: 'collection'
  })

  operations.push({
    algorithm: require(path.resolve(dummiesPath, './simple/operations/observe')),
    name: 'observation',
    state: 'object'
  })

  return operations
}
