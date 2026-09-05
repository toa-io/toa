/** The revision this endpoint serves, where a request carries its own metadata. */
export const MODERN = '2026-07-28'

/** The newest revision reached by an `initialize` handshake, which is what clients still send. */
export const LEGACY = '2025-11-25'

export const VERSIONS = [MODERN, LEGACY]

/** The version every JSON-RPC message states, which is not the protocol's. */
export const JSONRPC = '2.0'

/** The prefix the revision reserves for itself in `_meta`. */
export const RESERVED = 'io.modelcontextprotocol/'

export const PROTOCOL_VERSION = RESERVED + 'protocolVersion'
export const CLIENT_CAPABILITIES = RESERVED + 'clientCapabilities'
export const SERVER_INFO = RESERVED + 'serverInfo'

export type Params = Record<string, unknown>

export interface Message {
  jsonrpc: string
  method: string
  params?: Params

  /** Absent makes this a notification, which is answered by not answering. */
  id?: string | number
}

export interface Failure {
  code: number
  message: string
  data?: unknown
}

export interface Response {
  jsonrpc: string
  id: string | number | null
  result?: unknown
  error?: Failure
}

/** What a tool answers with: what a model reads, and the reply itself. */
export interface Result {
  content: Content[]
  structuredContent?: unknown

  /** The operation refused, which is something a model can read and correct. */
  isError?: boolean
}

export interface Content {
  type: 'text'
  text: string
}

export interface Tool {
  name: string
  description: string
  inputSchema: object
  outputSchema?: object
  annotations?: Annotations
}

/** What the verb says about the call, which the revision asks a client to treat as a hint. */
export interface Annotations {
  readOnlyHint?: boolean
  destructiveHint?: boolean
  idempotentHint?: boolean
}
