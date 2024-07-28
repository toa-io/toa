'use strict'

exports.payload = (event) => {
  return {
    id: event.state.id,
    inc: event.trailers.inc,
    inp: event.input?.inc
  }
}
