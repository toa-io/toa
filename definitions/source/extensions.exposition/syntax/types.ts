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
  query?: Query | null

  /**
   * Whether the operation this maps to answers a page of a collection, and so takes the
   * `omit` and `limit` a page is taken by. Written where the component's manifest is read,
   * beside `namespace` and `component`, and not declared.
   */
  paged?: boolean

  /**
   * Whether the operation answers a stream of a set, and so takes the `limit` of a page of it
   * and the `token` it continues from. Written beside `paged`, and not declared.
   */
  streamed?: boolean
}

export interface Query {
  id?: string
  criteria?: string
  search?: boolean
  sample?: number
  sort?: string
  omit?: Range
  limit?: Range
  selectors?: string[]
  projection?: string[]
  parameters?: string[]
  deleted?: boolean
}

export interface Range {
  value?: number
  range: [number, number]
}

export const verbs = new Set<string>([
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'LOCK',
  'UNLOCK'
])
