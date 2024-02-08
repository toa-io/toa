export type Service = {
  group: string
  name: string
  version: string
  port: number
  ingress?: {
    host: string
    class?: string
    annotations?: object
  }
  variables: Variable[]
  components?: string[]
}

export type Variable = {
  name: string
  value?: string
  secret?: {
    name: string,
    key: string
    optional?: boolean
  }
}

export type Variables = Record<'global' | string, Variable[]>

export type Dependency = {
  services?: Service[]
  variables?: Variables
}
