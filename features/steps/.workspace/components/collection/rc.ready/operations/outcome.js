// what the call made from the named phase ended in
export function computation(phase, context) {
  return context.state[phase]
}
