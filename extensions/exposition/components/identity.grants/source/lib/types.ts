import type { Call, Observation, Query, Stash, telemetry } from '@toa.io/types'

export interface Context {
  stash: Stash
  logs: telemetry.Logs
  local: {
    observe: Observation<Entity>
    enumerate: Observation<Entity[], never, Entity>
    transit: Call<Entity, TransitInput>
  }
  remote: {
    identity: {
      clients: {
        describe: Call<Client, DescribeInput>
      }
      tokens: {
        issue: Call<Issued, IssueInput>
      }
      keys: {
        disable: Call<void>
      }
    }
  }
  configuration: Configuration
}

export interface Configuration {
  readonly lifetime: number
  readonly token: number
}

export interface Entity {
  id: string
  _version?: number
  authority: string
  identity: string
  client: string
  scope?: string[]
  resource?: string[]
  kid?: string
  revokedAt?: number
  _created?: number
}

export type TransitInput = Omit<Entity, 'id' | 'revokedAt' | '_created'>

export interface Client {
  client_id: string
  client_name?: string
  redirect_uris: string[]
  permitted?: boolean
}

export interface DescribeInput {
  authority: string
  id: string
  redirect?: string
}

export interface IssueInput {
  authority: string
  identity: string
  label: string
  lifetime?: number
  scopes?: string[]
  permissions?: Record<string, string[]>
}

export interface Issued {
  kid: string
  exp?: number
  token: string
}

/** What is held against an authorization code until it is redeemed. */
export interface Code {
  identity: string
  client: string
  redirect: string
  challenge: string
  scope: string[]
  resource: string[]
}

export type { Query }
