import { nameVariable } from './naming.ts'
import { type AnnotationRecord, type URIMap } from './Deployment.ts'
import { environment } from '@toa.io/generic'

export function resolve(id: string, selector: string): string[] {
  const variable = nameVariable(id, selector)
  const value = environment.get(variable)

  if (value === undefined) throw new Error(`${variable} is not set.`)

  const urls = value.split(' ')

  return withCredentials(variable, urls)
}

export function resolveRecord(uris: URIMap, selector: string): AnnotationRecord {
  if (selector in uris) return getRecord(uris, selector)

  const segments = selector.split('.')

  while (segments.pop() !== undefined) {
    const current = segments.join('.')

    if (current in uris) return getRecord(uris, current)
  }

  if ('.' in uris) return getRecord(uris, '.')
  else throw new Error(`Selector '${selector}' cannot be resolved.`)
}

function withCredentials(variable: string, urls: string[]): string[] {
  const username = environment.get(variable + '_USERNAME') ?? ''
  const password = environment.get(variable + '_PASSWORD') ?? ''

  return urls.map((url) => addCredentials(url, username, password))
}

function addCredentials(ref: string, username: string, password: string): string {
  const url = new URL(ref)

  url.username = username
  url.password = password

  return url.href
}

function getRecord(uris: URIMap, key: string): AnnotationRecord {
  return {
    key,
    references: uris[key]
  }
}
