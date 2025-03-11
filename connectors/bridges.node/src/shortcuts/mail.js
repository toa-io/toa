'use strict'

const { underlay } = require('@toa.io/generic')

/** @type {toa.node.shortcut} */
function mail (context, aspect) {
  context.mail = underlay(async (segs, args) => {
    if (segs.length !== 1)
      throw new Error(`Mail aspect call should have 1 segment, [${segs.join(', ')}] given`)

    const method = segs[0]

    return aspect.invoke(method, ...args)
  })
}

exports.mail = mail
