export const up = (string) => string.toUpperCase().replaceAll('-', '_')
export const down = (string) => string.toLowerCase().replaceAll('_', '-')
export const capitalize = (string) => string[0].toUpperCase() + string.substring(1)
