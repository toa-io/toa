'use strict'

const { underlay } = require('@toa.io/generic')

/** @type {toa.node.shortcut} */
function atom (context, aspect) {
  context.atom = underlay((segs, args) => {
    if (segs.length !== 1)
      throw new Error(`Atom aspect call should have 1 segment, [${segs.join(', ')}] given`)

    const method = segs[0]

    return aspect.invoke(method, ...args)
  })
}

exports.atom = atom
