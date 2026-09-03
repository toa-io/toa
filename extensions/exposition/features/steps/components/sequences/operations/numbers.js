function * effect (amount) {
  for (let i = 0; i < amount; i++) yield i
}

export { effect }
