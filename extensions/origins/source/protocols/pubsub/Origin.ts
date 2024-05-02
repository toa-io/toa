import type { ClientConfig } from '@google-cloud/pubsub'

export interface Origin {
  readonly project: string
  readonly topic: string
  readonly endpoint?: string
  readonly credentials?: Credentials
}

export type Credentials = ClientConfig['credentials']
