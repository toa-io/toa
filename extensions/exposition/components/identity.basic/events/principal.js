export const condition = function (event, context) {
  return event.state.username === context.configuration.principal
}

export const payload = function (event) {
  return { id: event.state.id }
}
