'use strict'

const { underlay } = require('@toa.io/generic')

/** @type {toa.node.shortcut} */
const stash = (context, aspect) => {
  context.stash = underlay(async (segs, args) => {
    if (segs.length !== 1) throw new Error(`Stash aspect call should have 1 segment, [${segs.join(', ')}] given`)

    const method = segs[0]

    return aspect.invoke(method, ...args)
  })
}

exports.stash = stash
