import type { Locator } from '@toa.io/core'

export function construct (declaration: URIs | string): URIs

export function resolve (locator: Locator, uris: URIs): Resolution

type Node = string | {
  [key: string]: Node
}

type URIs = string | {
  default?: string
  [key: string]: Node
}

type Resolution = {
  url: URL
  entry: string
}
