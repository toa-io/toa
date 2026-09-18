export async function effect(input) {
  if (input.room === 'closed') return ERR_CLOSED

  return { room: input.room }
}

const ERR_CLOSED = new (class ClosedError extends Error {
  code = 'CLOSED'
  message = 'The room is closed'
})()
