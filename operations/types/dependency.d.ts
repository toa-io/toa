export type Service = {
  group: string
  name: string
  version: string
  port: number
  ingress: Ingress
  variables: Variable[]
  components?: string[]
  probe?: Probe
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

type Ingress = {
  hosts: string[]
  class?: string
  annotations?: object
}

interface Probe {
  port: number
  path: string
  delay?: number
}
