export async function transition(input: string, entry: string): Promise<object> {
  return { input, state: entry }
}
