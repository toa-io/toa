export const payload = (event) => {
  return {
    id: event.state.id,
    inc: event.trailers.inc
  }
}
