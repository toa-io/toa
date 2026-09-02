function * computation ({ limit }) {
  for (let i = 0; i < limit; i++) yield i
}

export { computation }
