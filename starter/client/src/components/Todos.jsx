import update from 'immutability-helper'
import React, { useEffect, useState } from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Image,
  Loader
} from 'semantic-ui-react'

import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'
import { deleteTodo, getTodos, patchTodo } from '../api/todos-api'
import { NewTodoInput } from './NewTodoInput'

export function Todos() {
  const { user, getAccessTokenSilently } = useAuth0()
  const [todos, setTodos] = useState([])
  const [loadingTodos, setLoadingTodos] = useState(true)
  const navigate = useNavigate()

  /* =========================
     FETCH TODOS
  ========================= */
  async function fetchTodos() {
    try {
      const accessToken = await getAccessTokenSilently({
        audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        scope: 'read:todo'
      })

      const todos = await getTodos(accessToken)
      setTodos(todos)
      setLoadingTodos(false)
    } catch (e) {
      alert(`Failed to fetch todos: ${e.message}`)
    }
  }

  useEffect(() => {
    fetchTodos()

    // ✅ FIX: refetch when user returns from edit page
    const onFocus = () => fetchTodos()
    window.addEventListener('focus', onFocus)

    return () => {
      window.removeEventListener('focus', onFocus)
    }
  }, [getAccessTokenSilently])

  /* =========================
     DELETE TODO
  ========================= */
  async function onTodoDelete(todoId) {
    try {
      const accessToken = await getAccessTokenSilently({
        audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        scope: 'delete:todo'
      })

      await deleteTodo(accessToken, todoId)
      setTodos(todos.filter((todo) => todo.todoId !== todoId))
    } catch (e) {
      alert('Todo deletion failed')
    }
  }

  /* =========================
     TOGGLE TODO
  ========================= */
  async function onTodoCheck(pos) {
    try {
      const todo = todos[pos]

      const accessToken = await getAccessTokenSilently({
        audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        scope: 'write:todo'
      })

      await patchTodo(accessToken, todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done
      })

      setTodos(
        update(todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      )
    } catch (e) {
      console.log('Failed to check a TODO', e)
      alert('Todo update failed')
    }
  }

  /* =========================
     NAVIGATE TO EDIT
  ========================= */
  function onEditButtonClick(todoId) {
    navigate(`/todos/${todoId}/edit`)
  }

  /* =========================
     RENDER
  ========================= */
  function renderTodos() {
    if (loadingTodos) {
      return renderLoading()
    }

    return (
      <Grid padded>
        {todos.map((todo, pos) => (
          <Grid.Row key={todo.todoId}>
            <Grid.Column width={1} verticalAlign="middle">
              <Checkbox
                onChange={() => onTodoCheck(pos)}
                checked={todo.done}
              />
            </Grid.Column>

            <Grid.Column width={10} verticalAlign="middle">
              {todo.name}
            </Grid.Column>

            <Grid.Column width={3} floated="right">
              {todo.dueDate}
            </Grid.Column>

            <Grid.Column width={1} floated="right">
              <Button
                icon
                color="blue"
                onClick={() => onEditButtonClick(todo.todoId)}
              >
                <Icon name="pencil" />
              </Button>
            </Grid.Column>

            <Grid.Column width={1} floated="right">
              <Button
                icon
                color="red"
                onClick={() => onTodoDelete(todo.todoId)}
              >
                <Icon name="delete" />
              </Button>
            </Grid.Column>

            {/* ✅ FIX: refreshed data + cache-safe image */}
            {todo.attachmentUrl && (
              <Grid.Column width={16}>
                <Image
                  src={`${todo.attachmentUrl}?t=${todo.todoId}`}
                  size="small"
                  wrapped
                />
              </Grid.Column>
            )}

            <Grid.Column width={16}>
              <Divider />
            </Grid.Column>
          </Grid.Row>
        ))}
      </Grid>
    )
  }

  console.log('Logged in user:', {
    name: user?.name,
    email: user?.email
  })

  return (
    <div>
      <Header as="h1">TODOs</Header>

      <NewTodoInput
        onNewTodo={(newTodo) => setTodos([...todos, newTodo])}
      />

      {renderTodos()}
    </div>
  )
}

/* =========================
   LOADING
========================= */
function renderLoading() {
  return (
    <Grid.Row>
      <Loader indeterminate active inline="centered">
        Loading TODOs
      </Loader>
    </Grid.Row>
  )
}


