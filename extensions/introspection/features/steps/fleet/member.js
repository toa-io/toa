import * as boot from '@toa.io/boot'

/**
 * One process of a deployment, forked by the halt steps.
 *
 * A halt is a thing a fleet does, and a fleet is processes: what a process counts as in
 * flight, what it has been told, and whether it is quiesced are all its own — ambient state
 * on a `Symbol.for` key — so two of them in one Node process would answer for each other.
 *
 * It reports what it is rather than answering questions, so a parent that missed a moment
 * still sees the state it left.
 */

const paths = JSON.parse(process.argv[2])

const workload = new boot.Workload(
  async (workload) => await workload.gate(async () => await boot.composition(paths))
)

await workload.connect()

const timer = setInterval(() => {
  process.send?.({ running: workload.running(), quiescent: workload.quiescent() })
}, 200)

timer.unref()

process.send?.({ up: true })

// a suite that died is not one that will ask for this process back
process.on('disconnect', () => {
  process.exit(0)
})

process.on('message', (message) => {
  if (message !== 'stop') return

  void workload.disconnect().then(() => {
    process.exit(0)
  })
})
