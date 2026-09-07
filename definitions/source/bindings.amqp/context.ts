import { type Dependency, type Variable } from '@toa.io/operations'
import { naming } from '@toa.io/pointer'
import { type Annotation } from './annotation.js'

export function createDependency(context: Context): Dependency {
  const global: Variable[] = []
  const variables = { global }

  const contextVariables = createVariables(context)

  global.push(...contextVariables)

  return { variables }
}

function createVariables(context: Context): Variable[] {
  const variables: Variable[] = []
  const uris = JSON.stringify(context)

  const contextVariable: Variable = {
    name: VARIABLE,
    value: uris
  }

  const secrets = createSecrets(context)

  variables.push(contextVariable, ...secrets)

  return variables
}

function createSecrets(context: Context): Variable[] {
  const secrets: Variable[] = []

  for (const key of Object.keys(context)) {
    const keySecrets = createKeySecrets(key)

    secrets.push(...keySecrets)
  }

  return secrets
}

function createKeySecrets(key: string): Variable[] {
  const username = createSecretVariable(key, 'username')
  const password = createSecretVariable(key, 'password')

  return [username, password]
}

function createSecretVariable(key: string, secretKey: string): Variable {
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

export const ID = 'amqp-context'
export const VARIABLE = 'TOA_AMQP_CONTEXT'

type Context = Annotation['context']
