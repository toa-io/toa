import { underlay } from '@toa.io/generic'

/** @type {toa.node.shortcut} */
export function chronicles(context, aspect) {
  context.chronicles = underlay((segs, args) => {
    if (segs.length !== 1)
      throw new Error(
        `Chronicles aspect call should have 1 segment, [${segs.join(', ')}] given`
      )

    return aspect.invoke(segs[0], ...args)
  })
}
