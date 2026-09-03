export const request = async (payload) => ({
  input: { booked: true },
  query: { id: payload.pot }
})
