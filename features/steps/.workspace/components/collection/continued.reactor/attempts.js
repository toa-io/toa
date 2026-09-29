/**
 * How many times each run has been attempted in this process. Kept outside the context, so that
 * nothing continuity gives back reaches it.
 */
const attempts = new Map()

export function attempt(operation, input) {
  const key = `${operation}:${input.a}`
  const n = (attempts.get(key) ?? 0) + 1

  attempts.set(key, n)

  return n
}
