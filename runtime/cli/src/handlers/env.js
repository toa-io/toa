'use strict'

const { join } = require('node:path')
const dotenv = require('dotenv')
const { each } = require('@toa.io/generic')
const { file } = require('@toa.io/filesystem')
const boot = require('@toa.io/boot')
const { context: find } = require('../util/find')

async function env (argv) {
  const path = find(argv.path)
  const filepath = join(path, '.env')
  const operator = await boot.deployment(path, argv.environment)
  const variables = operator.variables()
  const currentValues = await read(filepath)
  const nextValues = merge(variables.global, currentValues)

  console.log(nextValues)

  if (argv.environment === 'local') localDefaults(nextValues)

  console.log(nextValues)

  await write(filepath, nextValues)
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
  const contents = values.reduce((lines, { name, value }) => lines + `${name}=${value}\n`, '')

  await file.write(path, contents)
}

/**
 * @param {toa.deployment.dependency.Variable[] } variables
 * @param {Record<string, string>} current
 * @return {toa.deployment.dependency.Variable[]}
 */
function merge (variables, current) {
  return variables.map((variable) => {
    if (variable.secret === undefined) return variable

    return {
      name: variable.name,
      value: current[variable.name] ?? ''
    }
  })
}

/**
 * @param {toa.deployment.dependency.Variable[]} variables
 */
function localDefaults (variables) {
  each(variables, ({ name, value }) => {
    if (value === '') {
      if (name.endsWith('_USERNAME')) value = 'developer'
      if (name.endsWith('_PASSWORD')) value = 'secret'
      if (value !== '') return { name, value }
    }
  })
}

exports.env = env
