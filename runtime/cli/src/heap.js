import { setFlagsFromString } from 'node:v8'

/**
 * Counts the memory a process holds in buffers towards the limit that starts a mark-compact,
 * rather than every byte it has allocated in them since the last one.
 *
 * Allocated bytes are what a V8 before 14.8 counts, dead or alive, and a process that passes
 * large buffers through — a gateway writing a component's reply — starts a mark-compact of its
 * whole heap every few megabytes of them, while the buffers are already garbage by then. The
 * flag is V8's own, from 13.0, and on by default from 14.8, where it no longer exists: a Node on
 * a V8 without it is left alone, so nothing needs removing when the runtime moves to one, and a
 * Node 22 is not told of a flag it does not know.
 *
 * Set from the program rather than on the command line, where a Node that does not know a flag
 * refuses to start.
 */
export function account() {
  if (!accounts()) return

  setFlagsFromString('--external-memory-accounted-in-global-limit')
}

/** Whether the V8 has the flag, and so does not count buffers this way by default. */
export function accounts(version = process.versions.v8) {
  const [major, minor] = version.split('.').map(Number)

  return major === 13 || (major === 14 && minor < 8)
}
