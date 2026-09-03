export async function computation (input, object, context) {
  return { input, state: object, context: context !== undefined }
}
