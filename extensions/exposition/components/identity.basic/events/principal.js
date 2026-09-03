export const condition = function (event, context) {
  const principal = context.configuration.principal

  return principal !== undefined &&
    event.state.authority === principal.authority &&
    event.state.username === principal.username
}

export const payload = function (event) {
  return { id: event.state.id }
}
