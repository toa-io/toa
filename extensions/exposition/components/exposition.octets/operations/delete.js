function del (input, context) {
  return context.storages[input.storage].delete(input.path)
}

export { del as effect }
