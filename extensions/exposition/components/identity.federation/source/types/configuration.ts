export interface Configuration {
  trust?: Trust[]
  implicit: boolean
  principal?: Principal
}

export interface Trust {
  iss: string
  aud?: [string, ...string[]]
  secrets?: Record<string, Record<string, string>>
}

interface Principal {
  iss: string
  sub: string
}
