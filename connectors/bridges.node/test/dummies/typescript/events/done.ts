export function condition (event: { state: { done: boolean } }): boolean {
  return event.state.done
}

export function payload (event: { state: { id: string } }): { id: string } {
  return { id: event.state.id }
}
