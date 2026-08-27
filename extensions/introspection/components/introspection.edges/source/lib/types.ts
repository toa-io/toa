export interface Source {
  namespace?: string
  component?: string
  operation?: string
  event?: string
  service?: string
}

export interface Target {
  namespace: string
  component: string
  operation?: string
  event?: string
}

export interface Sample {
  at: number
  input?: unknown
  outcome: string
}

export interface Observed {
  kind: string
  src: Source
  dst: Target
  sample?: Sample
}

export interface Edge extends Observed {
  id: string
}

export interface Input {
  edges: Record<string, Observed>
}
