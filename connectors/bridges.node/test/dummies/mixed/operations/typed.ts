export async function transition (input: string, object: string): Promise<object> {
  return { input, state: object }
}
