import fs from 'fs'
import util from 'util'

import yaml from 'js-yaml'

/**
 * @param path {string} YAML file path
 * @returns {Promise<void>}
 */
export default async path => {
  const readFile = util.promisify(fs.readFile)
  const contents = await readFile(path, 'utf8')
  const doc = yaml.load(contents)

  return doc
}
