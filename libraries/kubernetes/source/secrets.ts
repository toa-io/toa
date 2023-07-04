import { $ } from '@toa.io/command'

export async function get (name: string, namespace?: string): Promise<Data | null> {
  try {
    const { stdout } = await $`kubectl get secret ${name}${n(namespace)} -o json`
    const secret = JSON.parse(stdout) as Secret

    return decode(secret.data)
  } catch {
    return null
  }
}

export async function upsert (name: string, data: Data, namespace?: string): Promise<void> {
  const value = await get(name, namespace) ?? {}

  Object.assign(value, data)

  await deploy(name, value, namespace)
}

async function deploy (name: string, data: Data, namespace?: string): Promise<void> {
  const secret = encode(name, data)
  const json = JSON.stringify(secret)

  await $`echo '${json}' | kubectl apply${n(namespace)} -f -`
}

function decode (data: Data): Data {
  return apply(data, atob)
}

function encode (name: string, data: Data): Secret {
  const encoded = apply(data, btoa)

  return {
    apiVersion: 'v1',
    kind: 'Secret',
    type: 'Opaque',
    metadata: { name },
    data: encoded
  }
}

function apply (data: Data, fn: (input: string) => string): Data {
  const result: Data = {}

  for (const [key, value] of Object.entries(data))
    result[key] = fn(value)

  return result
}

interface Secret {
  apiVersion: 'v1'
  kind: 'Secret'
  type: 'Opaque'
  metadata: {
    name: string
  }
  data: Data
}

type Data = Record<string, string>

function n (namespace?: string): string {
  return namespace === undefined ? '' : ` -n ${namespace}`
}
