const events = async (component) => {
  if (component.events === undefined) return

  const binding = await asynchronous(component.bindings)

  for (const event of Object.values(component.events)) {
    if (event.binding === undefined) event.binding = binding
  }
}

/** The first binding that carries events, which only its module can say. */
async function asynchronous (bindings) {
  for (const binding of bindings) {
    const { properties } = await import(binding)

    if (properties.async === true) return binding
  }

  return undefined
}

export { events }
