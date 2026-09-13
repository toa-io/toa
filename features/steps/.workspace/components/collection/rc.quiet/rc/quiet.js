export function stop(ctx) {
  ctx.state.marks ??= []
  ctx.state.marks.push('stop')
}

export function resume(ctx) {
  ctx.state.marks ??= []
  ctx.state.marks.push('resume')
}
