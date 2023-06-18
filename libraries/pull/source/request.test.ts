import { request } from './'

it('should be', async () => {
  expect(request).toBeInstanceOf(Function)
})

it('should perform http request', async () => {
  const httpRequest = `GET http://localhost:8888 HTTP/1.1\naccept: appication/json\n\n`
  const httpResponse = await request(httpRequest)

  expect(httpResponse).toMatch('200 OK')
  expect(httpResponse).toMatch('content-type: application/json')
  expect(httpResponse).toMatch('"hostname":"localhost"')
})
