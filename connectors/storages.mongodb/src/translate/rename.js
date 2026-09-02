const rename = (name) => {
  return RENAME[name] || name
}

const RENAME = { id: '_id' }

export { rename }
