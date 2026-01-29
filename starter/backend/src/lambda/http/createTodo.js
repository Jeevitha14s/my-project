import { v4 as uuidv4 } from "uuid"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"
import { parseUserId } from "../../auth/utils.mjs"
import { createLogger } from "../../utils/logger.mjs"

const logger = createLogger("createTodo")

const ddbClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(ddbClient)

const TODOS_TABLE = process.env.TODOS_TABLE

export async function handler(event) {
  logger.info("CreateTodo Lambda invoked")

  try {
    if (!event.body) {
      throw new Error("Missing request body")
    }

    const newTodo = JSON.parse(event.body)
    logger.info("Parsed request body", {
      name: newTodo.name,
      dueDate: newTodo.dueDate
    })

    const userId = parseUserId(event)
    logger.info("Creating todo for user", { userId })

    const todoId = uuidv4()
    const createdAt = new Date().toISOString()

    const item = {
      userId,
      todoId,
      createdAt,
      name: newTodo.name,
      dueDate: newTodo.dueDate,
      done: false
    }

    await docClient.send(
      new PutCommand({
        TableName: TODOS_TABLE,
        Item: item
      })
    )

    logger.info("Todo created successfully", { todoId })

    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true
      },
      body: JSON.stringify({ item })
    }
  } catch (error) {
    logger.error("Failed to create todo", {
      error: error.message,
      stack: error.stack
    })

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true
      },
      body: JSON.stringify({
        error: "Could not create todo"
      })
    }
  }
}




