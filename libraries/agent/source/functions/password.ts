export function password (_: unknown, length: string = '16'): string {
  const l = Number.parseInt(length)

  return Array.from({ length: l }, () => CHARSET[Math.floor(Math.random() * CHARSET.length)]).join('')
}

const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-='
