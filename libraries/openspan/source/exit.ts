/**
 * What is flushed when the process runs out of work. One listener for every exporter of this
 * copy of the package: a process that reconfigures itself makes new exporters, and one listener
 * each is a leak Node warns of at the eleventh.
 *
 * Held weakly, so an exporter a reconfiguration replaced is not kept for the sake of its flush.
 */
const exporters = new Set<WeakRef<Flushed>>()

let armed = false

export function exiting(exporter: Flushed): void {
  for (const reference of exporters)
    if (reference.deref() === undefined) exporters.delete(reference)

  exporters.add(new WeakRef(exporter))

  if (armed) return

  armed = true

  process.once('beforeExit', () => {
    armed = false

    for (const reference of exporters) void reference.deref()?.flush()
  })
}

interface Flushed {
  flush: () => Promise<void>
}
