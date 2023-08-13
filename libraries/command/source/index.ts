import { exec } from 'node:child_process'

export async function $ (strings: TemplateStringsArray, ...args: string[]): Promise<Result> {
  const command = parse(strings, args)

  return await new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error !== null) reject(error)
      else resolve({ stdout, stderr })
    })
  })
}

function parse (strings: TemplateStringsArray, args: string[]): string {
  return strings.reduce((string, chunk, index) => {
    string += (index > 0 ? args[index - 1] : '') + chunk

    return string
  }, '')
}

interface Result {
  stdout: string
  stderr: string
}
