/** @type {toa.node.shortcut} */
export function configuration (context, aspect) {
  Object.defineProperty(context, 'configuration', {
    get: () => aspect.invoke()
  })
}
