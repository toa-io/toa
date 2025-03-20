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

export type KeyComponentMethod = 'ip' | 'path'
export type KeyConditionMethod = 'status'

export type KeyComponent = Rule<KeyComponentMethod>
export type KeyCondition = Rule<KeyConditionMethod>
