/** An ordinary operation of a component that also takes a stream: nothing carries it over HTTP. */
export async function computation({ of }) {
  return of * 2
}
