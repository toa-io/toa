import { nameVariable } from './naming'

export function resolve (id: string, selector: string): string [] {
  const variable = nameVariable(id, selector)
  const value = process.env[variable]

  if (value === undefined) throw new Error(`${variable} is not set.`)

  const urls = value.split(' ')

  return withCredentials(variable, urls)
}

function withCredentials (variable: string, urls: string[]): string[] {
  const username = process.env[variable + '_USERNAME'] ?? ''
  const password = process.env[variable + '_PASSWORD'] ?? ''

  return urls.map((url) => addCredentials(url, username, password))
}

function addCredentials (ref: string, username: string, password: string): string {
  const url = new URL(ref)

  url.username = username
  url.password = password

  return url.href
}
