'use strict'

const { join } = require('node:path')
const readline = require('node:readline/promises')
const { stdin: input, stdout: output } = require('node:process')
const dotenv = require('dotenv')
const { V3 } = require('paseto')
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

  if (argv.dev) {
    const secrets = await resolveDevSecrets(result)

    mergeSecrets(result, secrets)
  }

  if (argv.interactive) {
    const secrets = await promptSecrets(result)

    mergeSecrets(result, secrets)
  } else if (argv.dev)
    assertNoPendingSecrets(result)

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
 * @return {Promise<Record<string, string>>}
 */
async function resolveDevSecrets (variables) {
  const secrets = {}

  for (const variable of variables) {
    if (variable.secret === undefined) continue

    const key = getKey(variable.secret)

    if (!(key in DEV_SECRETS) || key in secrets) continue

    secrets[key] = await resolveDevSecret(key)
  }

  return secrets
}

/**
 * @param {string} key
 * @return {Promise<string>}
 */
async function resolveDevSecret (key) {
  const source = DEV_SECRETS[key]

  if (source.value !== undefined)
    return source.value

  if (source.env !== undefined) {
    const value = process.env[source.env]

    if (value === undefined || value === '')
      throw new Error(`${source.env} is not set`)

    return value
  }

  if (source.generate === true)
    return /** @type {string} */ (await V3.generateKey('local', { format: 'paserk' }))

  throw new Error(`Unknown dev secret source for ${key}`)
}

/**
 * @param {toa.deployment.dependency.Variable[]} variables
 */
function assertNoPendingSecrets (variables) {
  const pending = []

  for (const variable of variables) {
    if (variable.secret === undefined) continue

    const key = getKey(variable.secret)

    if (!pending.includes(key))
      pending.push(key)
  }

  if (pending.length === 0) return

  throw new Error(`${pending.join(', ')} is not set (pass --interactive to prompt)`)
}

/**
 * @param {toa.deployment.dependency.Variable[]} variables
 * @param {Record<string, string>} secrets
 */
function mergeSecrets (variables, secrets) {
  for (const variable of variables) {
    if (variable.secret === undefined) continue

    const key = getKey(variable.secret)

    if (!(key in secrets)) continue

    variable.value = secrets[key]

    delete variable.secret
  }
}

function getKey (secret) {
  return `${secret.name}/${secret.key}`
}

const SECRETS = {}

/**
 * @type {Record<string, { value?: string, env?: string, generate?: boolean }>}
 */
const DEV_SECRETS = {
  'toa-mongodb.default/username': { value: 'developer' },
  'toa-mongodb.default/password': { value: 'secret' },
  'toa-amqp-context.default/username': { value: 'developer' },
  'toa-amqp-context.default/password': { value: 'secret' },
  'toa-storages-assets/API_KEY': { env: 'CLOUDINARY_API_KEY' },
  'toa-storages-assets/API_SECRET': { env: 'CLOUDINARY_API_SECRET' },
  'toa-configuration/IDENTITY_TOKENS_KEY0': { generate: true },
  'toa-configuration/RESEND_KEY': { env: 'RESEND_KEY' }
}

exports.env = env
exports.promptSecrets = promptSecrets
