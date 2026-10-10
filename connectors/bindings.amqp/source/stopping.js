/**
 * Whether this process has begun to stop serving.
 *
 * A call an operation makes while it handles a delivery holds the teardown open until it is
 * answered, so whatever waits on its behalf — the pause before a call is sent again — has to end
 * when the teardown begins rather than when it reaches the connector that is waiting, which is
 * after the delivery it holds open.
 */

let controller = new AbortController()

/** A producer has started closing. */
export function begin() {
  controller.abort()
}

/** A producer has opened: the process serves again, as after a halt. */
export function reset() {
  if (controller.signal.aborted) controller = new AbortController()
}

/** Aborted once the process has begun to stop. */
export function signal() {
  return controller.signal
}
