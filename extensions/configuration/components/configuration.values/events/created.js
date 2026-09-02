'use strict'

exports.payload = function (event) {
  return { component: event.state.component, epoch: event.state.epoch }
}
