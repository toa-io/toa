export interface Node {
  protected?: boolean
  isolated?: boolean
  forward?: string
  routes: Route[]
  methods: Method[]
  directives: Directive[]
}

export interface Route {
  path: string
  node: Node
}

export interface Method {
  verb: string
  mapping?: Mapping
  directives: Directive[]
}

export interface Directive {
  family: string
  name: string
  value: any
}

export interface Mapping {
  namespace?: string
  component?: string
  endpoint: string
  query?: Query
}

export interface Query {
  id?: string
  criteria?: string
  sort?: string
  omit: Range
  limit: Range
  selectors?: string[]
  projection?: string[]
}

export interface Range {
  value?: number
  range: [number, number]
}

export const verbs = new Set<string>(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
