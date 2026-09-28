// the shape of an entity's id
const ID = /^[0-9a-f]{32}$/

export function computation(_, context) {
  const first = context.id()
  const second = context.id()

  return { id: ID.test(first) && ID.test(second), distinct: first !== second }
}
