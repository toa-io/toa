/**
 * Expands the ranges in the host of a URL into a URL per number: `amqp://rmq[0..31].example.com`
 * is `rmq00` to `rmq31`. Every number is as wide as the end of the range is written, so the names
 * of a range sort as they count.
 *
 * Only the host is looked at: credentials, a path and a query are free to contain anything, and
 * an IPv6 literal, which is bracketed as well, has no `..` in it.
 *
 * @param {string} input
 * @returns {string[]}
 */
export const shards = (input) => {
  const parts = input.match(AUTHORITY)

  if (parts === null) return [input]

  const [, head, host, tail] = parts

  return hosts(host).map((host) => head + host + tail)
}

/**
 * @param {string} host
 * @returns {string[]}
 */
function hosts(host) {
  const range = host.match(RANGE)

  if (range === null) return [host]

  const [expression, from, to] = range
  const start = Number(from)
  const end = Number(to)

  if (end <= start)
    throw new RangeError(`Range ${expression} must end above where it starts`)

  const width = to.length
  const before = host.slice(0, range.index)
  const after = host.slice(range.index + expression.length)
  const expanded = []

  for (let n = start; n <= end; n++)
    // whatever follows may hold a range of its own
    for (const rest of hosts(after))
      expanded.push(before + String(n).padStart(width, '0') + rest)

  return expanded
}

/** What precedes the host, the host with its port, and what follows. */
const AUTHORITY = /^([a-z][a-z0-9+.-]*:\/\/(?:[^@/?#]*@)?)([^/?#]*)(.*)$/i

const RANGE = /\[(\d+)\.\.(\d+)]/
