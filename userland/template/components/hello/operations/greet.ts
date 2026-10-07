import type { GreetInput } from '../types/index.d.ts'

export async function computation (input: GreetInput) {
  return { greeting: `Hello, ${input.name ?? 'world'}!` }
}
