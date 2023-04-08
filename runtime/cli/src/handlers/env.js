'use strict'

const { join } = require('node:path')
const dotenv = require('dotenv')
const boot = require('@toa.io/boot')
const { context: find } = require('../util/find')
const { file } = require('@toa.io/filesystem')

/**
 * @param path {string}
 * @return {$ObjMap<string, string>}
 */
async function getCurrentEnv (path) {
  const exists = await file.exists(path)
  if (exists === false) {
    return {}
  }
  const content = await file.read(path)
  return dotenv.parse(content)
}

async function env (argv) {
  const path = find(argv.path)
  const filepath = join(path, '.env')
  const operator = await boot.deployment(path, argv.environment)
  const variables = operator.variables()
  const env = await getCurrentEnv(filepath)
  const lines = variables.global.map((variable) => `${variable.name}=${variable.secret ? env[variable.name] ?? '' : variable.value}`)
  const contents = lines.join('\n')

  await file.write(filepath, contents)
}

exports.env = env
