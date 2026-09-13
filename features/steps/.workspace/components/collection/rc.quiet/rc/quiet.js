export function pause(ctx) {
  ctx.state.marks ??= []
  ctx.state.marks.push('pause')
}

export function resume(ctx) {
  ctx.state.marks ??= []
  ctx.state.marks.push('resume')
}
