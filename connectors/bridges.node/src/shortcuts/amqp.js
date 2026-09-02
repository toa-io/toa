import { underlay } from '@toa.io/generic'
import assert from 'node:assert'

/** @type {toa.node.shortcut} */
function amqp (context, aspect) {
  context.amqp = underlay(async (segs, args) => {
    assert(segs.length === 2, `AMQP aspect call should have 2 segments [${segs.join(', ')}] given`)

    const [origin, method] = segs

    return aspect.invoke(origin, method, ...args)
  })
}

export { amqp }
