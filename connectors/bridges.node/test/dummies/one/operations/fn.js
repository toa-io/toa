async function transition (input, object, context) {
  return { input, state: object, context: context !== undefined }
}

export { transition }
