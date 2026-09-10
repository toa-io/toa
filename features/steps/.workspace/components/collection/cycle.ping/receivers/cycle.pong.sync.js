// the event carries the record; what the operation needs is which one to increment
export const request = (payload) => ({ query: { id: payload.id } })
