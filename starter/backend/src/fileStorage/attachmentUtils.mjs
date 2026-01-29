import AWS from 'aws-sdk'

const s3 = new AWS.S3({
  signatureVersion: 'v4'
})

export function getUploadUrl(todoId) {
  return s3.getSignedUrl('putObject', {
    Bucket: process.env.ATTACHMENTS_S3_BUCKET,
    Key: todoId,
    Expires: process.env.SIGNED_URL_EXPIRATION
  })
}
