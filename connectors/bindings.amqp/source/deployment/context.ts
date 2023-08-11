import { type Dependency, type Variable } from '@toa.io/operations'
import { encode, decode } from '@toa.io/generic'
import { resolveRecord, naming } from '@toa.io/pointer'
import { type Locator } from '@toa.io/core'
import { type AnnotationRecord } from '@toa.io/pointer/transpiled/Deployment'
import { type Annotation } from './annotation'

export function createDependency (context: Context): Dependency {
  const global: Variable[] = []
  const variables = { global }

  const contextVariables = createVariables(context)

  global.push(...contextVariables)

  return { variables }
}

export function resolveURIs (locator: Locator): string[] {
  if (process.env.TOA_DEV === '1') return ['amqp://developer:secret@localhost']

  const value = process.env[VARIABLE]

  if (value === undefined) throw new Error(`Environment variable ${VARIABLE} is not specified`)

  const map = decode(value)
  const record = resolveRecord(map, locator.id)

  return parseRecord(record)
}

function createVariables (context: Context): Variable[] {
  const variables: Variable[] = []
  const uris = encode(context)

  const contextVariable: Variable = {
    name: VARIABLE,
    value: uris
  }

  const secrets = createSecrets(context)

  variables.push(contextVariable, ...secrets)

  return variables
}

function createSecrets (context: Context): Variable[] {
  const secrets: Variable[] = []

  for (const key of Object.keys(context)) {
    const keySecrets = createKeySecrets(key)

    secrets.push(...keySecrets)
  }

  return secrets
}

function createKeySecrets (key: string): Variable[] {
  const username = createSecretVariable(key, 'username')
  const password = createSecretVariable(key, 'password')

  return [username, password]
}

function createSecretVariable (key: string, secretKey: string): Variable {
  const varKey = key === '.' ? '' : key
  const varName = naming.nameVariable(ID, varKey, secretKey.toUpperCase())
  const secName = naming.nameSecret(ID, key)

  return {
    name: varName,
    secret: {
      name: secName,
      key: secretKey
    }
  }
}

function parseRecord (record: AnnotationRecord): string[] {
  const urls = new Array(record.references.length)
  const key = record.key === '.' ? '' : record.key
  const username = readEnv(key, 'USERNAME')
  const password = readEnv(key, 'PASSWORD')

  for (let i = 0; i < record.references.length; i++) {
    const url = new URL(record.references[i])

    url.username = username
    url.password = password

    urls[i] = url.href
  }

  return urls
}

function readEnv (key: string, name: string): string {
  const variable = naming.nameVariable(ID, key, name)
  const value = process.env[variable]

  if (value === undefined) throw new Error(variable + ' is not set')
  else return value
}

const ID = 'amqp-context'
const VARIABLE = 'TOA_AMQP_CONTEXT'

type Context = Annotation['context']
