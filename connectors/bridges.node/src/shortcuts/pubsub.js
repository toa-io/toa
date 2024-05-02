'use strict'

const { underlay } = require('@toa.io/generic')
const assert = require('node:assert')

function pubsub (context, aspect) {
  context.pubsub = underlay(async (segs, args) => {
    assert(segs.length === 2, `Pub/Sub aspect call should have 2 segments [${segs.join(', ')}] given`)

    const [origin, method] = segs

    return aspect.invoke(method, origin, ...args)
  })
}

exports.pubsub = pubsub
