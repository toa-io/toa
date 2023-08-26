import { type Observation } from '@toa.io/types'

export interface Credentials {
  username: string
  password: string
}

export interface Context {
  local: {
    observe: Observation<Entity>
  }
  configuration: {
    readonly rounds: number
    readonly pepper: string
  }
}

interface Entity {
  id: string
  username: string
  password: string
}
