import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import dotenv from 'dotenv'
import { V3 } from 'paseto'
import { deployment } from '@toa.io/operations'
import { readFile, writeFile } from 'node:fs/promises'
import { context as find } from '../util/find.js'

const { Factory } = deployment

export async function env (argv) {
  const path = find(argv.path)
  const filepath = join(path, argv.as)
  const factory = await Factory.create(path, argv.environment)
  const operator = await factory.operator()
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
  let contents

  try {
    contents = await readFile(path, 'utf8')
  } catch {
    return {}
  }

  return dotenv.parse(contents)
}

/**
 * @param {string} path
 * @param {toa.deployment.dependency.Variable[]} values
 * @return {Promise<void>}
 */
async function write (path, values) {
  const contents = values.reduce((lines, { name, value }) => lines + `${name}=${value ?? ''}\n`, '')

  await writeFile(path, contents, 'utf8')
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

export async function promptSecrets (variables) {
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

    if (key in secrets) continue

    if (key in DEV_SECRETS) {
      secrets[key] = await resolveDevSecret(key)
      continue
    }

    const value = process.env[variable.secret.key]

    if (value !== undefined && value !== '')
      secrets[key] = value
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

  if (source.generate === 'jwe')
    return randomBytes(32).toString('base64url')

  if (source.generate === true || source.generate === 'paseto')
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
 * @type {Record<string, { value?: string, generate?: boolean }>}
 */
const DEV_SECRETS = {
  'toa-mongodb.default/username': { value: 'developer' },
  'toa-mongodb.default/password': { value: 'secret' },
  'toa-amqp-context.default/username': { value: 'developer' },
  'toa-amqp-context.default/password': { value: 'secret' },
  'toa-configuration/IDENTITY_TOKENS_KEY0': { generate: 'paseto' },
  'toa-configuration/IDENTITY_TOKENS_ENCRYPTION_KEY0': { generate: 'jwe' }
}
