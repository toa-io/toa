async function effect (input) {
  await new Promise((resolve) => setTimeout(resolve, 500))

  return null
}

export { effect }
