type Reference = {
  name: string
  version: string
  repository?: string
  alias?: string
  values?: Object
}

type Service = {
  group: string
  name: string
  version: string
  port: number
  ingress?: {
    host: string
    class: string
    annotations?: object
  }
}

type Variable = {
  name: string
  value?: string
  secret?: {
    name: string,
    key: string
  }
}

type Variables = Record<string, Variable[]>

export type Dependency = {
  references?: Reference[]
  services?: Service[]
  variables?: Variables
}
