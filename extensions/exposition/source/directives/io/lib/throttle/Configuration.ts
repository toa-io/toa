export interface Configuration {
  key: KeyComponent[]
  condition?: KeyCondition[]
  requests: number
  interval: number
  cooldown: number
}

interface Rule<T, K = unknown> {
  method: T
  options?: K
}

export type KeyComponentMethod = 'ip' | 'path' | 'route' | 'identity' | 'segment'
export type KeyConditionMethod = 'status'

export type KeyComponent = Rule<KeyComponentMethod>
export type KeyCondition = Rule<KeyConditionMethod>

type KeyEntry = KeyComponentMethod | Record<KeyComponentMethod, unknown>
type KeyDeclaration = KeyEntry | KeyEntry[]

type ConditionDeclaration =
  Record<KeyConditionMethod, unknown>
  | Array<Record<KeyConditionMethod, unknown>>

export interface Declaration extends Omit<Configuration, 'key' | 'condition'> {
  key: KeyDeclaration
  condition?: ConditionDeclaration
}

export function parse (declaration: Declaration): Configuration {
  const { key, condition, requests, interval, cooldown } = declaration

  return {
    key: mapKey(key),
    condition: mapCondition(condition),
    requests,
    interval: interval * 1000,
    cooldown: cooldown * 1000
  }
}

function mapKey (declaration: KeyDeclaration): KeyComponent[] {
  const entries = Array.isArray(declaration) ? declaration : [declaration]

  // a bare `path`, or `segment: id` for the ones that take an argument
  return entries.flatMap((entry): KeyComponent[] =>
    typeof entry === 'string'
      ? [{ method: entry }]
      : Object.entries(entry).map(([method, options]) =>
        ({ method: method as KeyComponentMethod, options })))
}

function mapCondition (declaration?: ConditionDeclaration): KeyCondition[] | undefined {
  if (declaration === undefined)
    return

  // reduce to a single object, then map entries to rules
  const conditions = Array.isArray(declaration) ? declaration : [declaration]
  const single = conditions.reduce((acc, condition) => ({ ...acc, ...condition }), {})

  return Object.entries(single).map(([method, options]) => ({ method, options })) as KeyCondition[]
}
