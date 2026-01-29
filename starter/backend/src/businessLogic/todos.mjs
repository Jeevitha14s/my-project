import { v4 as uuidv4 } from 'uuid'
import { TodosAccess } from '../dataLayer/todosAccess.mjs'
import { getUploadUrl } from '../fileStorage/attachmentUtils.mjs'

const todosAccess = new TodosAccess()

// Get all todos for a user
export async function getTodosForUser(userId) {
  return await todosAccess.getTodos(userId)
}

// Create a new todo
export async function createTodo(userId, newTodo) {
  const todoItem = {
    userId,
    todoId: uuidv4(),
    createdAt: new Date().toISOString(),
    done: false,
    attachmentUrl: '',
    ...newTodo
  }

  await todosAccess.createTodo(todoItem)
  return todoItem
}

// Update an existing todo
export async function updateTodo(userId, todoId, updatedTodo) {
  await todosAccess.updateTodo(userId, todoId, updatedTodo)
}

// Delete a todo
export async function deleteTodo(userId, todoId) {
  await todosAccess.deleteTodo(userId, todoId)
}

// Generate attachment upload URL
export async function createAttachmentPresignedUrl(todoId) {
  return await getUploadUrl(todoId)
}
