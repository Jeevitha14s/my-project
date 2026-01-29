import { decode } from 'jsonwebtoken'
import { createLogger } from '../utils/logger.mjs'

const logger = createLogger('utils')
/**
 * Parse a JWT token and return a user id
 * @param jwtToken JWT token to parse
 * @returns a user id from the JWT token
 */
export function parseUserId(event) {
  const authorization = event.headers.Authorization || event.headers.authorization
  const split = authorization.split(' ')
  const token = split[1]

  const decodedToken = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64').toString()
  )

  return decodedToken.sub
}


