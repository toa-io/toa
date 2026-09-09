export const request = (payload) => {
  return {
    query: { id: payload.id },
    // the operation requires `amount`, so its contract refuses this and always will
    input: {}
  }
}
