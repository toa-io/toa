// holds the call for as many milliseconds as it is given, so that a scenario can look at a
// process while it is handling one
export async function computation(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms))

  return 'held'
}
