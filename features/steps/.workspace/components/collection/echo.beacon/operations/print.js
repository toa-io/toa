// what a component's code sees of the environment: the output is a string, so an absent
// variable is said in words
export async function computation(input) {
  return process.env[input] ?? '(unset)'
}
