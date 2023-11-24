'use strict'

const { join } = require('node:path')
const readline = require('node:readline/promises')
const { stdin: input, stdout: output } = require('node:process')
const dotenv = require('dotenv')
const { deployment: { Factory } } = require('@toa.io/operations')
const { file } = require('@toa.io/filesystem')
const { context: find } = require('../util/find')

async function env (argv) {
  const path = find(argv.path)
  const filepath = join(path, argv.as)
  const factory = await Factory.create(path, argv.environment)
  const operator = factory.operator()
  const variables = operator.variables()
  const currentValues = await read(filepath)

  const result = merge(variables, currentValues)

  if (argv.interactive) {
    const secrets = await promptSecrets(result)

    mergeSecrets(result, secrets)
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
  const secrets = {}

  for (const variable of variables) {
    if (variable.secret === undefined) continue

    const key = getKey(variable.secret)

    secrets[key] = await promptSecret(key, rl)
  }

  rl.close()

  return secrets
}

async function promptSecret (key, rl) {
  if (SECRETS[key] === undefined) SECRETS[key] = await rl.question(`${key}: `)

  return SECRETS[key]
}

/**
 * @param {toa.deployment.dependency.Variable[]} variables
 * @param {Record<string, string>} secrets
 */
function mergeSecrets (variables, secrets) {
  for (const variable of variables) {
    if (variable.secret === undefined) continue

    const key = getKey(variable.secret)

    variable.value = secrets[key]

    delete variable.secret
  }
}

function getKey (secret) {
  return `${secret.name}/${secret.key}`
}

const SECRETS = {}

exports.env = env
exports.promptSecrets = promptSecrets
