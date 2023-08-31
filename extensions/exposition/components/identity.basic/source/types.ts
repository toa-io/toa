import { type Call, type Observation } from '@toa.io/types'

export interface Context {
  local: {
    observe: Observation<Entity>
    transit: Call<TransitOutput, TransitInput>
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

export interface TransitInput {
  username?: string
  password?: string
}

interface TransitOutput {
  id: string
}
