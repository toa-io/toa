'use strict'

const { join } = require('node:path')
const readline = require('node:readline/promises')
const { stdin: input, stdout: output } = require('node:process')

const dotenv = require('dotenv')
const { file } = require('@toa.io/filesystem')
const boot = require('@toa.io/boot')
const { context: find } = require('../util/find')

async function env (argv) {
  const path = find(argv.path)
  const filepath = join(path, argv.as)
  const operator = await boot.deployment(path, argv.environment)
  const variables = operator.variables()
  const currentValues = await read(filepath)
  const values = []

  for (const scoped of Object.values(variables)) {
    values.push(...scoped)
  }

  let result = merge(values, currentValues)

  if (argv.interactive) {
    result = await promptSecrets(result)
  }

  await write(filepath, result)
}

/**
 * @param path {string}
 * @returns {Record<string, string>}
 */
async function read (path) {
  const exists = await file.is(path)

  if (!exists) return {}

  const contents = await file.read(path)

  return dotenv.parse(contents)
}

/**
 * @param {string} path
 * @param {toa.deployment.dependency.Variable[]} values
 * @return {Promise<void>}
 */
async function write (path, values) {
  const contents = values.reduce((lines, { name, value }) => lines + `${name}=${value ?? ''}\n`, '')

  await file.write(path, contents)
}

/**
 * @param {toa.deployment.dependency.Variable[]} variables
 * @param {Record<string, string>} current
 * @return {toa.deployment.dependency.Variable[]}
 */
function merge (variables, current) {
  return variables.map((variable) => {
    if (variable.secret === undefined || !current[variable.name]) return variable

    return {
      name: variable.name,
      value: current[variable.name]
    }
  })
}

async function promptSecrets (variables) {
  const rl = readline.createInterface({ input, output })
  const result = []

  for (const variable of variables) {
    if (variable.secret === undefined) result.push(variable)
    else result.push(await promptSecret(variable, rl))
  }

  rl.close()

  return result
}

async function promptSecret (variable, rl) {
  const key = `${variable.secret.name}/${variable.secret.key}`
  const value = await prompt(key, rl)

  return {
    name: variable.name,
    value
  }
}

async function prompt (key, rl) {
  if (SECRETS[key] === undefined) SECRETS[key] = await rl.question(`${key}: `)

  return SECRETS[key]
}

const SECRETS = {}

exports.env = env
