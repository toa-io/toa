import type { Locale } from './types'

/**
 * Formats a date into a short localized representation, carrying the year only when the date
 * falls outside the current one (e.g., "Feb 17" this year, "Feb 17, 2024" earlier).
 *
 * @param value - ISO date string or Date
 * @param locale - Locale for formatting
 * @returns Formatted date string
 */
export function date(value: string | Date | number, locale: Locale): string {
  const d = new Date(value)
  const year = d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric'

  return new Intl.DateTimeFormat(locale, { year, month: 'short', day: 'numeric' }).format(d)
}

/**
 * Formats an ISO duration string into a localized representation (e.g., "1 year", "1 month").
 *
 * @param iso - ISO duration string
 * @param locale - Locale for formatting
 * @returns Formatted duration string
 */
export function formatISODuration(iso: string, locale: Locale): string {
  const match = iso.match(/^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/)

  if (match === null) return iso

  const [, y, mo, w, d, h, mi, s] = match.map((v) => Number.isNaN(Number(v)) ? undefined : Number(v))

  // @ts-ignore Intl.DurationFormat — Stage 3 proposal, available at runtime in modern engines
  return new Intl.DurationFormat(locale, { style: 'long' })
    .format({ years: y, months: mo, weeks: w, days: d, hours: h, minutes: mi, seconds: s })
}
