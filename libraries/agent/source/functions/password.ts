export function password (_: string, length: string = '12'): string {
  const l = Number.parseInt(length)

  return Array.from({ length: l }, () => CHARSET[Math.floor(Math.random() * CHARSET.length)]).join('')
}

const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-='
