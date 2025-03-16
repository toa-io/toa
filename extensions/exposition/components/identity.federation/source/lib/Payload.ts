import type * as jose from 'jose'

export interface Payload extends jose.JWTPayload {
  iss: string
  sub: string
}
