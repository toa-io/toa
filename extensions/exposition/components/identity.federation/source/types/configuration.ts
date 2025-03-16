export interface Configuration {
  trust: Trust[]
  principal?: Principal
  assert?: boolean
}

export interface Trust {
  iss: string
  aud?: string | [string, ...string[]]
  secret?: string
  signature?: {
    iss: string
    kid: string
    key: string
  }
}

interface Principal {
  iss: string
  sub: string
}
