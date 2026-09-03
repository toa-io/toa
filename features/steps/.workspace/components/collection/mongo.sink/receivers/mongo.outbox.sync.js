export const request = (payload) => {
  return {
    query: { id: payload.id }
  }
}
