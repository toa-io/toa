import { resolve, resolveRecord, naming } from '@toa.io/pointer'
import { environment } from '@toa.io/generic'
import { CONTEXT, CONTEXT_VARIABLE, SOURCES } from '@toa.io/definitions/bindings.amqp'
import type { Locator } from '@toa.io/core'
import type { URIMap } from '@toa.io/pointer'
import type { AnnotationRecord } from '@toa.io/pointer/transpiled/Deployment.js'

/** The brokers of the context, as the deployment wrote them into the environment. */
export function context(locator: Locator): string[] {
  // Toa's own development stack is not on the conventional ports: the applications built on
  // Toa are, and they share the machine. See CONTRIBUTING.md. A scenario that restarts a broker
  // starts one of its own and names it, since the shared one is everybody's.
  if (environment.get('TOA_DEV') === '1')
    return [environment.get('TOA_DEV_AMQP') ?? 'amqp://developer:secret@localhost:31010']

  const value = environment.get(CONTEXT_VARIABLE)

  if (value === undefined)
    throw new Error(`Environment variable ${CONTEXT_VARIABLE} is not specified`)

  const map = JSON.parse(value) as URIMap
  const record = resolveRecord(map, locator.id)

  return parseRecord(record)
}

/** The brokers a component receives from, as the deployment wrote them. */
export function sources(locator: Locator): string[] {
  return resolve(SOURCES, locator.id)
}

function parseRecord(record: AnnotationRecord): string[] {
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

function readEnv(key: string, name: string): string {
  const variable = naming.nameVariable(CONTEXT, key, name)
  const value = environment.get(variable)

  if (value === undefined) throw new Error(variable + ' is not set')
  else return value
}
