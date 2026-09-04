/**
 * Whether a client may receive a code at this address.
 *
 * Exact string comparison, which RFC 6749 §3.1.2.3 requires, except for a loopback
 * address: a native client binds whatever port is free when it starts, so RFC 8252 §7.3
 * has the port ignored there. Claude Code registers `http://localhost/callback` and
 * `http://127.0.0.1/callback` and comes back on an ephemeral port; comparing those
 * literally would refuse every one of them.
 */
export function permits (registered: string[], redirect: string): boolean {
  return registered.some((uri) => uri === redirect || loopback(uri, redirect))
}

function loopback (registered: string, redirect: string): boolean {
  const a = parse(registered)
  const b = parse(redirect)

  if (a === null || b === null)
    return false

  return a.protocol === 'http:' && b.protocol === 'http:' &&
    LOOPBACK.has(a.hostname) && a.hostname === b.hostname &&
    a.pathname === b.pathname && a.search === b.search
}

function parse (value: string): URL | null {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

/** `localhost` resolves through the host's own configuration, which RFC 8252 §8.3 warns of. */
const LOOPBACK = new Set(['127.0.0.1', '[::1]', 'localhost'])
