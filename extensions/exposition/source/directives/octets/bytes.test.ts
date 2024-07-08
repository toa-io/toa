import { toBytes } from './bytes'

it('should parse bytes', async () => {
  expect(toBytes('10')).toBe(10)
  expect(toBytes('10B')).toBe(10)
})

it('should parse binary prefix', async () => {
  expect(toBytes('10KiB')).toBe(10240)
  expect(toBytes('10MiB')).toBe(10485760)
  expect(toBytes('10GiB')).toBe(10737418240)
  expect(toBytes('10TiB')).toBe(10995116277760)
})

it('should parse decimal prefix', async () => {
  expect(toBytes('10kB')).toBe(10000)
  expect(toBytes('10MB')).toBe(10000000)
  expect(toBytes('10GB')).toBe(10000000000)
  expect(toBytes('10TB')).toBe(10000000000000)
})

it('should parse incorrect value as binary', async () => {
  expect(toBytes('10b')).toBe(10)
  expect(toBytes('10kb')).toBe(10240)
  expect(toBytes('10kib')).toBe(10240)
  expect(toBytes('10mb')).toBe(10485760)
  expect(toBytes('10gb')).toBe(10737418240)
  expect(toBytes('10tib')).toBe(10995116277760)
  expect(toBytes('10Mb')).toBe(10485760)
})
