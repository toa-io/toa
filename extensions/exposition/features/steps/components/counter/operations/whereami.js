// answered by the process the call named, and by no other
export async function computation(input, context) {
  return { instance: context.instance }
}
