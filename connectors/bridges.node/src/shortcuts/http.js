'use strict'

const { underlay } = require('@toa.io/generic')

/** @type {toa.node.shortcut} */
const http = (context, aspect) => {
  context.http = underlay(async (segs, args) => {
    if (segs.length < 2) throw new Error(`Origins call requires at least 2 arguments, ${segs.length} given`)

    const name = segs.shift()
    const method = segs.pop().toUpperCase()
    const path = segs.join('/')
    const request = { method, ...args[0] }
    const options = args[1]

    return await aspect.invoke(name, path, request, options)
  })
}

exports.http = http
