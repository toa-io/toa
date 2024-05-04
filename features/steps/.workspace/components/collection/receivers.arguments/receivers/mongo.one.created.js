'use strict'

exports.request = (event, hello, world) => {
  return {
    input: `${hello} ${world}, ${event.id} at ${event._created}`
  }
}
