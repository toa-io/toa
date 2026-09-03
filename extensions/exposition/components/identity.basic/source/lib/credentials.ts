/**
 * The user-id and the password of Basic credentials. RFC 7617 forbids a colon in the
 * user-id and allows any number of them in the password, so the split is at the first one.
 */
export function split (credentials: string): [string, string] | null {
  const decoded = Buffer.from(credentials, 'base64').toString()
  const colon = decoded.indexOf(':')

  if (colon === -1)
    return null

  return [decoded.slice(0, colon), decoded.slice(colon + 1)]
}
