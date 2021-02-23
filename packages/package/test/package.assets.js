import path from 'path'
import url from 'url'
import { createRequire } from 'module'

import yaml from '../src/yaml'

const require = createRequire(import.meta.url)

export const options = { manifestFile: 'manifest.yaml' }
export const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
export const loadExpectedManifest = async () => await yaml(path.resolve(__dirname, 'package.assets', 'expected.yaml'))

export const loadExpectedOperations = async () => {
  const operations = []

  operations.push({
    algorithm: require('./package.assets/operations/one'),
    name: 'transition',
    state: 'collection'
  })

  operations.push({
    algorithm: require('./package.assets/operations/two'),
    name: 'observation',
    state: 'object'
  })

  return operations
}
