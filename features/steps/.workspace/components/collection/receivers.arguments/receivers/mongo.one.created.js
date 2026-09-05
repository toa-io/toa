export const request = (event, hello, world) => {
  return {
    input: `${hello} ${world}, ${event.id} at ${event.CREATED}`
  }
}
