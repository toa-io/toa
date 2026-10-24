// the record as it stands, without what identifies the customer
export const payload = (event) => {
  const { email, ...rest } = event.state

  return rest
}
