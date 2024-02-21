export async function response (response: Response): Promise<string> {
  const statusLine = `${response.status} ${response.statusText}\n`
  const headerLines = stringifyHeaders(response.headers) + '\n'
  const responseText = await response.text()

  return statusLine + headerLines + responseText
}

function stringifyHeaders (headers: Headers): string {
  let lines = ''

  headers.forEach((value, name) =>
    (lines += `${name}: ${value}\n`))

  return lines
}
