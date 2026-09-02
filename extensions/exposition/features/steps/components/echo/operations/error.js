function computation () {
  const err = { code: 'CODE', message: 'message' }

  Object.setPrototypeOf(err, Error.prototype)

  return err
}

export { computation }
