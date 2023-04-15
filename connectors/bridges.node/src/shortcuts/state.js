'use strict'

const { generate } = require('@toa.io/generic')

/** @type {toa.node.shortcut} */
const state = (context, aspect) => {
  context.state = generate((segs, value) => {
    if (value === undefined) return get(aspect, segs)
    else set(aspect, segs, value)
  })
}

/**
 * @param {toa.core.extensions.Aspect} aspect
 * @param {string[]} segs
 * @return {any}
 */
function get (aspect, segs) {
  let cursor = aspect.invoke()

  for (const seg of segs) cursor = cursor[seg]

  return cursor
}

/**
 * @param {toa.core.extensions.Aspect} aspect
 * @param {string[]} segs
 * @param {any} value
 */
function set (aspect, segs, value) {
  const object = build(segs, value)

  aspect.invoke(object)
}

/**
 * @param {string[]} segs
 * @param {any} value
 */
function build (segs, value) {
  const object = {}
  let cursor = object
  const key = segs.pop()

  for (const seg of segs) cursor = cursor[seg] = {}

  if (value !== undefined) cursor[key] = value
  else cursor[key] = {}

  return object
}

exports.state = state
