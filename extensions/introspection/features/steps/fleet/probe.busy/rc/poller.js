/** Deliberately never cleared: what a quiesce cannot reach is what a halt is decided against. */
export function ready(context) {
  context.state.poller = setInterval(() => {
    void context.remote.probe.target.compute({ input: { a: 1, b: 1 } }).catch(() => {})
  }, 500)

  context.state.poller.unref()
}
