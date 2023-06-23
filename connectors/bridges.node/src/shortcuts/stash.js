'use strict'

/** @type {toa.node.shortcut} */
const stash = (context, aspect) => {
  context.stash = { get: get(aspect), set: set(aspect) }
}

function get (aspect) {
  return function (key) {
    return aspect.invoke('get', key)
  }
}

function set (aspect) {
  return function (key, value) {
    return aspect.invoke('set', key, value)
  }
}

exports.stash = stash
