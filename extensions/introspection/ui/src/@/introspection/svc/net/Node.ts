/** The static description of a component, as its manifest declares it. */
export interface Node {
  id: string
  namespace: string
  component: string
  version: string
  entity: Entity | null
  operations: Operation[]
  events: Event[]
  receivers: Receiver[]
  extensions: string[]
  _created: number
  _updated: number
  _version: number
  _deleted?: number | null
}

export interface Entity {
  schema: object
  storage?: string
  associated: boolean
}

export interface Operation {
  endpoint: string
  type: string
  scope?: string
  query?: boolean
  input?: object | null
  output?: object | null
  errors?: string[]
}

export interface Event {
  label: string
  binding?: string
}

export interface Receiver {
  label: string
  source: string
  event: string
  operation: string
  conditioned: boolean
  adaptive: boolean
}
