import { type Dependency, type Variable } from '@toa.io/operations'
import { encode } from '@toa.io/generic'
import { naming } from '@toa.io/pointer'
import { type Annotation } from './annotation'

export function createDependency (context: Context): Dependency {
  const global: Variable[] = []
  const variables = { global }

  const contextVariables = createVariables(context)

  global.push(...contextVariables)

  return { variables }
}

function createVariables (context: Context): Variable[] {
  const variables: Variable[] = []
  const contextMap = encode(context)

  const contextVariable: Variable = {
    name: 'TOA_AMQP_CONTEXT',
    value: contextMap
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

const ID = 'amqp-context'

type Context = Annotation['context']
