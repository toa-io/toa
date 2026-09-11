// the name of the process that answered, which a later call may name
export async function computation(input, context) {
  return { instance: context.instance }
}
