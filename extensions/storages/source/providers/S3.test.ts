import { Readable } from 'node:stream'
import { randomUUID } from 'node:crypto'
import streamConsumers from 'node:stream/consumers'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import { S3 } from './S3'

/* eslint-disable @typescript-eslint/no-non-null-assertion -- jest expect is not type guard */

describe('S3 storage provider', () => {
  let provider: S3
  let s3endpoint: ReturnType<typeof setupServer>

  const AWS_REGION = 'us-east-1'
  const TEST_BUCKET_NAME = 'test-bucket'
  const S3_ENDPOINT = `https://${TEST_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`

  beforeAll(async () => {
    jest.useRealTimers()
    s3endpoint = setupServer()
    s3endpoint.listen({ onUnhandledRequest: 'error' })

    provider = new S3({
      bucket: TEST_BUCKET_NAME,
      region: AWS_REGION
    }, {
      ACCESS_KEY_ID: 'test-key',
      SECRET_ACCESS_KEY: 'test-key-secret'
    })
  })

  afterEach(() => {
    s3endpoint.resetHandlers()
  })

  afterAll(() => {
    s3endpoint.close()
  })

  test('should be able to get file from S3 handling leading slash', async () => {
    const testBody = randomUUID().repeat(10)

    s3endpoint.use(http.get(`${S3_ENDPOINT}/some/absolute/path/filename`,
      () => HttpResponse.text(testBody)))

    const body = await provider.get('/some/absolute/path/filename')

    expect(body).toBeInstanceOf(Readable)
    expect((await streamConsumers.text(body!))).toBe(testBody)
  })

  test('should remove folder with all files', async () => {
    const headHandler = jest.fn().mockReturnValue(HttpResponse.xml('', { status: 404 }))

    const listHandler = jest.fn().mockReturnValueOnce(HttpResponse.xml(`
    <ListBucketResult>
      <NextContinuationToken>someToken</NextContinuationToken>
      <KeyCount>1001</KeyCount>
      <MaxKeys>1000</MaxKeys>
      <IsTruncated>true</IsTruncated>
      <Contents>
        <Key>happy_face1.jpg</Key>
      </Contents>
    </ListBucketResult>
    `, {
      status: 200
    })).mockReturnValueOnce(HttpResponse.xml(`
    <ListBucketResult>
      <KeyCount>1001</KeyCount>
      <MaxKeys>1000</MaxKeys>
      <Contents>
        <Key>happy_face2.jpg</Key>
      </Contents>
      <Contents>
        <Key>happy_face3.jpg</Key>
      </Contents>
    </ListBucketResult>
    `, {
      status: 200
    }))

    const deleteHandler = jest.fn().mockReturnValue(HttpResponse.xml(`
    <DeleteResult>
      <Deleted>
        <Key>happy_face1.jpg</Key>
      </Deleted>
      <Deleted>
        <Key>happy_face2.jpg</Key>
      </Deleted>
      <Deleted>
        <Key>happy_face3.jpg</Key>
      </Deleted>
    </DeleteResult>
    `, {
      status: 200
    }))

    s3endpoint.use(http.head(`${S3_ENDPOINT}/some/absolute/path_to_remove`,
      headHandler),
    http.get(`${S3_ENDPOINT}/`,
      listHandler),
    http.post(`${S3_ENDPOINT}/`,
      deleteHandler))

    await provider.delete('/some/absolute/path_to_remove')

    expect(headHandler).toHaveBeenCalledTimes(1)
    expect(listHandler).toHaveBeenCalledTimes(2)
    expect(deleteHandler).toHaveBeenCalledTimes(1)
  })

  test('should be able to upload a file to S3', async () => {
    const body = Readable.from('test content')

    const handler = jest.fn().mockReturnValue(HttpResponse.xml('', {
      status: 200,
      headers: {
        ETag: 'test-etag',
        'x-amz-id-2': 'test_id_2',
        'x-amz-request-id': 'test_request_id',
        Server: 'AmazonS3'
      }
    }))

    s3endpoint.use(http.put(`${S3_ENDPOINT}/some/absolute/path/filename`,
      handler))

    await provider.put('/some/absolute/path', 'filename', body)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(body.readableEnded).toBe(true)
  })
})
