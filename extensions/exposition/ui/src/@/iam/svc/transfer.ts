import { fragment, convert } from '$lib/tools'

/**
 * Consume a session `challenge` passed via the URL fragment.
 */
export function consume(): string | null {
  const base64url = fragment('challenge')

  if (base64url === null) return null
  else return convert.fromBase64Url(base64url)
}
