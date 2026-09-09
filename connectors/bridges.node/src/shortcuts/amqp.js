import { underlay } from '@toa.io/generic'

/** @type {toa.node.shortcut} */
export function amqp(context, aspect) {
  context.amqp = underlay(async (segs, args) => {
    if (segs.length !== 2)
      throw new Error(
        `AMQP aspect call should have 2 segments [${segs.join(', ')}] given`
      )

    const [origin, method] = segs

    return aspect.invoke(origin, method, ...args)
  })
}
