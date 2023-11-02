import { S3Client, CreateBucketCommand } from '@aws-sdk/client-s3'

export const initScript = async (url: URL, secrets?: Record<string, string>): Promise<void> => {
  const client = new S3Client({
    credentials: {
      accessKeyId: secrets?.ACCESS_KEY ?? '',
      secretAccessKey: secrets?.SECRET_ACCESS_KEY ?? ''
    },
    region: url.host ?? '',
    endpoint: url.searchParams.get('endpoint') ?? ''
  })
  const createBucketCMD = new CreateBucketCommand({
    Bucket: url.pathname.substring(1)
  })

  try {
    await client.send(createBucketCMD)
  } catch (err: any) {
    console.log(err)
  }
}
