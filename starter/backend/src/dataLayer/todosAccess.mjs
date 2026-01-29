import AWS from 'aws-sdk'
import { createLogger } from '../utils/logger.mjs'

const logger = createLogger('TodosAccess')

export class TodosAccess {
  constructor() {
    this.docClient = new AWS.DynamoDB.DocumentClient()
    this.todosTable = process.env.TODOS_TABLE
    this.createdAtIndex = process.env.TODOS_CREATED_AT_INDEX
  }

  // Get all todos for a user
  async getTodos(userId) {
    logger.info('Getting todos for user', { userId })

    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        IndexName: this.createdAtIndex,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()

    return result.Items
  }

  // Create a new todo
  async createTodo(todoItem) {
    logger.info('Creating new todo', { todoId: todoItem.todoId })

    await this.docClient
      .put({
        TableName: this.todosTable,
        Item: todoItem
      })
      .promise()
  }

  // Update an existing todo
  async updateTodo(userId, todoId, updatedTodo) {
    logger.info('Updating todo', { todoId })

    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId
        },
        UpdateExpression:
          'set #name = :name, dueDate = :dueDate, done = :done',
        ExpressionAttributeNames: {
          '#name': 'name'
        },
        ExpressionAttributeValues: {
          ':name': updatedTodo.name,
          ':dueDate': updatedTodo.dueDate,
          ':done': updatedTodo.done
        }
      })
      .promise()
  }

  // Delete a todo
  async deleteTodo(userId, todoId) {
    logger.info('Deleting todo', { todoId })

    await this.docClient
      .delete({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId
        }
      })
      .promise()
  }
}
