/** @type {toa.node.shortcut} */
export function schedule(context, aspect) {
  const schedule = (endpoint, request, recurrence) =>
    aspect.invoke('schedule', endpoint, request, recurrence)

  schedule.cancel = (id) => aspect.invoke('cancel', id)

  context.schedule = schedule
}
