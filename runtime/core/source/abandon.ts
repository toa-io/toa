import { AbandonedException } from './exceptions.js'
import type { Exception } from './exceptions.js'

/** What a caller that stopped waiting for `target` is told. */
export function abandoned(target: string, signal: AbortSignal): Exception {
  return new AbandonedException(`'${target}' went unanswered`, signal.reason)
}

/**
 * What the promise settles with, or *abandoned* once the signal aborts, whichever comes first — at
 * once where it has aborted already. The promise goes on running, and settles with nobody waiting
 * for it.
 */
export async function waiting<T>(
  promise: Promise<T>,
  signal: AbortSignal | undefined,
  target: string
): Promise<T> {
  if (signal === undefined) return await promise

  if (signal.aborted) {
    promise.catch(noop)

    throw abandoned(target, signal)
  }

  let abort: () => void = noop

  const aborted = new Promise<never>((_resolve, reject) => {
    abort = () => reject(abandoned(target, signal))
  })

  signal.addEventListener('abort', abort, { once: true })

  try {
    return await Promise.race([promise, aborted])
  } catch (exception) {
    // however the wait ended — here, or in whatever was carrying it
    if (signal.aborted) throw abandoned(target, signal)

    throw exception
  } finally {
    signal.removeEventListener('abort', abort)
  }
}

function noop(): void {}
