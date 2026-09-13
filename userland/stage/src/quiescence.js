import { state } from './state.js'

/**
 * Stops what everything staged does of its own accord, holding every connection open — what a
 * process does when it is told to go quiet. A component's `stop` run command runs here.
 */
export const halt = async () => {
  for (const composition of state.compositions) await composition.halt()
  for (const workload of state.workloads) await workload.halt()
}

/** Starts it again, running the `resume` command. */
export const restore = async () => {
  for (const composition of state.compositions) await composition.restore()
  for (const workload of state.workloads) await workload.restore()
}
