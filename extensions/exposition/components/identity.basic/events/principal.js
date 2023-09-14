'use strict'

exports.condition = function (event, context) {
  return event.state.username === context.configuration.principal
}

exports.payload = function (event) {
  return { id: event.state.id }
}
