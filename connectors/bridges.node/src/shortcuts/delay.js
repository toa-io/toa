/** @type {toa.node.shortcut} */
export function delay (context, aspect) {
  const delay = (endpoint, request, options) => aspect.invoke('delay', endpoint, request, options)

  delay.cancel = (id) => aspect.invoke('cancel', id)

  context.delay = delay
}
