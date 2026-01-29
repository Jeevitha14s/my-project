import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import { parseUserId } from "../../auth/utils.mjs"
import { createLogger } from "../../utils/logger.mjs"

const logger = createLogger("getTodos")

const ddbClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(ddbClient)
const s3 = new S3Client({})

const TODOS_TABLE = process.env.TODOS_TABLE
const TODOS_CREATED_AT_INDEX = process.env.TODOS_CREATED_AT_INDEX
const BUCKET_NAME = process.env.ATTACHMENTS_S3_BUCKET

export async function handler(event) {
  logger.info("GetTodos Lambda invoked")

  try {
    const userId = parseUserId(event)

    const result = await docClient.send(
      new QueryCommand({
        TableName: TODOS_TABLE,
        IndexName: TODOS_CREATED_AT_INDEX,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId
        },
        ScanIndexForward: false
      })
    )

    const items = result.Items || []

    // 🔑 THIS IS THE MISSING PIECE
    for (const item of items) {
      if (item.attachmentKey) {
        const getObjectCmd = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: item.attachmentKey
        })

        item.attachmentUrl = await getSignedUrl(s3, getObjectCmd, {
          expiresIn: 300
        })
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true
      },
      body: JSON.stringify({ items })
    }

  } catch (error) {
    logger.error("GetTodos failed", { error })

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true
      },
      body: JSON.stringify({ error: "Could not fetch todos" })
    }
  }
}



