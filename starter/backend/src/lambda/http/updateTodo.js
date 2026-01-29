import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { parseUserId } from "../../auth/utils.mjs"


const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)


const TODOS_TABLE = process.env.TODOS_TABLE

export async function handler(event) {
  console.log("EVENT:", JSON.stringify(event))

  try {
    
    const todoId = event.pathParameters.todoId
    const updatedTodo = JSON.parse(event.body)

    
    const authorization =
      event.headers.Authorization || event.headers.authorization

    if (!authorization) {
      throw new Error("No Authorization header")
    }

    
    const userId = parseUserId(event)

    
    await docClient.send(
      new UpdateCommand({
        TableName: TODOS_TABLE,
        Key: {
          userId,
          todoId
        },
        UpdateExpression: "set #name = :name, done = :done",
        ExpressionAttributeNames: {
          "#name": "name"
        },
        ExpressionAttributeValues: {
          ":name": updatedTodo.name,
          ":done": updatedTodo.done
        }
      })
    )

    
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true
      },
      body: JSON.stringify({
        message: "Todo updated"
      })
    }

  } catch (error) {
    console.error("ERROR:", error)

    return {
      statusCode: 500,
      headers: {
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Credentials': true
}

      ,
      body: JSON.stringify({
        error: error.message
      })
    }
  }
}

