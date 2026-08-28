export interface Described {
  namespace: string
  component: string
  version?: string
  entity?: unknown
  operations?: unknown
  events?: unknown
  receivers?: unknown
  extensions?: unknown
}

export interface Node extends Described {
  id: string
}

export interface Input {
  nodes: Record<string, Described>
}
