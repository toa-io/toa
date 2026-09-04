/**
 * The form of a token this component issues, or nothing for a credential it did not:
 * a compact JWE has five segments, where a JWS — an OpenID `id_token`, say — has three.
 * Read without decrypting, and without trusting: a credential that lies about its form
 * only reaches a verifier that rejects it.
 */
export function form (token: string): Form | null {
  if (token.startsWith(PASETO))
    return 'paseto'

  if (segments(token) === JWE_SEGMENTS)
    return 'jwe'

  return null
}

function segments (token: string): number {
  let count = 1

  for (let i = 0; i < token.length; i++)
    if (token.charCodeAt(i) === DOT)
      count++

  return count
}

const PASETO = 'v3.local.'
const JWE_SEGMENTS = 5
const DOT = 46

export type Form = 'paseto' | 'jwe'
