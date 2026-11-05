import { load } from './jose.js'
import type * as jose from 'jose'
import type { Key } from '../types/index.ts'

/** A key imported once, by what it is: configuration may name another one under the same `kid`. */
const signers = new Map<string, Promise<jose.CryptoKey>>()

export async function signer(key: Key): Promise<jose.CryptoKey> {
  const pem = key.key.unwrap()

  if (!signers.has(pem)) signers.set(pem, importing(pem))

  return await signers.get(pem)!
}

async function importing(pem: string): Promise<jose.CryptoKey> {
  const jose = await load()

  return await jose.importPKCS8(pem, ALG)
}

/**
 * The public part of a key, which is all a verifier reads. Read as the signer reads it, so a key
 * that signs is one that is published: a PEM kept on one line included.
 */
export async function publish(key: Key): Promise<jose.JWK> {
  const jose = await load()
  const pair = await jose.importPKCS8(key.key.unwrap(), ALG, { extractable: true })
  const { kty, crv, x, y } = await jose.exportJWK(pair)

  return { kty, crv, x, y, kid: key.kid, alg: ALG, use: 'sig' }
}

export const ALG = 'ES256'
