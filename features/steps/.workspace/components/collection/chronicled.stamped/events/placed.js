// rendered as the change is published, which is when the change was made, and says no UPDATED
export const payload = (event) => ({ total: event.state.total, rendered: Date.now() })
