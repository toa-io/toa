export async function computation (input) {
  return process.env[input]
}
