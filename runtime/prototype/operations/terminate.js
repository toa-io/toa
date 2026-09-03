function terminate (_, changeset) {
  changeset._deleted = Date.now()
}

export { terminate as assignment }
