import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { createLogger } from "../../utils/logger.mjs"

const logger = createLogger("generateUploadUrl")

const s3Client = new S3Client({ region: "us-east-1" })
const ddbClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(ddbClient)

const TODOS_TABLE = process.env.TODOS_TABLE
const BUCKET_NAME = process.env.ATTACHMENTS_S3_BUCKET
const URL_EXPIRATION = 300

function getUserId(event) {
  return (
    event?.requestContext?.authorizer?.principalId ||
    event?.requestContext?.authorizer?.jwt?.claims?.sub
  )
}

export async function handler(event) {
  const todoId = event.pathParameters.todoId
  const userId = getUserId(event)

  const objectKey = `${todoId}.png`

  // 🔹 PreSigned PUT URL (upload only)
  const uploadUrl = await getSignedUrl(
    s3Client,
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
      ContentType: "image/png"
    }),
    { expiresIn: URL_EXPIRATION }
  )

  // 🔹 Public URL to store in DB (for display)
  const attachmentUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${objectKey}`

  // ✅ Store attachmentUrl in DynamoDB
  await docClient.send(
    new UpdateCommand({
      TableName: TODOS_TABLE,
      Key: { userId, todoId },
      UpdateExpression: "set attachmentUrl = :a",
      ExpressionAttributeValues: {
        ":a": attachmentUrl
      }
    })
  )

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true
    },
    body: JSON.stringify({ uploadUrl })
  }
}
