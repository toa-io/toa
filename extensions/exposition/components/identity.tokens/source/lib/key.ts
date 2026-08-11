export function jweKey (value: string): Uint8Array {
  const key = Buffer.from(value, 'base64url')

  if (key.length !== 32 || key.toString('base64url') !== value)
    throw new TypeError('JWE key must be a base64url-encoded 256-bit secret')

  return new Uint8Array(key)
}
