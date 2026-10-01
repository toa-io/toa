// Allocates buffers nothing keeps, beside a heap that is kept, and prints the mark-compacts
// that ran. What the flag is for is how often these start, and the answer is V8's own.
import { PerformanceObserver, constants } from 'node:perf_hooks'

const { account } = await import('../../src/heap.js')

if (process.argv[2] === 'accounted') account()

let major = 0

new PerformanceObserver((list) => {
  for (const entry of list.getEntries())
    if (entry.detail.kind === constants.NODE_PERFORMANCE_GC_MAJOR) major++
}).observe({ entryTypes: ['gc'] })

const kept = Array.from({ length: 300_000 }, (_, i) => ({ i }))

// long enough that a run sharing the CPU with the rest of the suite still starts well over the
// mark-compacts the test needs to tell one run from the other
for (let i = 0; i < 6000; i++) {
  Buffer.alloc(512 * 1024)

  if (i % 10 === 0) await new Promise((resolve) => setImmediate(resolve))
}

// the observer is told on a later turn
await new Promise((resolve) => setTimeout(resolve, 50))

console.log(JSON.stringify({ major, kept: kept.length }))
