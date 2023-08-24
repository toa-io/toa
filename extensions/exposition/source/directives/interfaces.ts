import type * as http from '../HTTP'

export interface Directive {
  pre?: (message: http.IncomingMessage) => Promise<http.OutgoingMessage>
  post?: (message: http.IncomingMessage) => Promise<http.OutgoingMessage>
}

export interface Factory {
  readonly name: string

  create: (name: string, value: any) => Directive
}

export type Constructor = new (value: any) => Directive
