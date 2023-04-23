'use strict'

const { underlay } = require('@toa.io/generic')

/** @type {toa.node.shortcut} */
const amqp = (context, aspect) => {
  context.amqp = underlay(async (segs, args) => {
    if (segs.length !== 2) throw new Error(`AMQP aspect call should have 2 segments [${segs.join(', ')}] given`)

    const [origin, method] = segs

    return aspect.invoke(origin, method, ...args)
  })
}

exports.amqp = amqp
