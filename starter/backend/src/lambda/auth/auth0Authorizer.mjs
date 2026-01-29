import Axios from 'axios'
import jsonwebtoken from 'jsonwebtoken'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('auth')

const jwksUrl = 'https://dev-3qw4oiik3fe3onpn.us.auth0.com/.well-known/jwks.json'

export async function handler(event) {
  try {
    const jwtToken = await verifyToken(event.authorizationToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader) {
  const token = getToken(authHeader)

  // Decode token to get header (kid)
  const decodedJwt = jsonwebtoken.decode(token, { complete: true })
  if (!decodedJwt) {
    throw new Error('Invalid JWT token')
  }

  const kid = decodedJwt.header.kid

  // Get signing keys from Auth0
  const response = await Axios.get(jwksUrl)
  const keys = response.data.keys

  const signingKey = keys.find(key => key.kid === kid)
  if (!signingKey) {
    throw new Error('Signing key not found')
  }

  // Convert JWK to PEM
  const cert = signingKey.x5c[0]
  const publicKey = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----`

  // Verify token
  return jsonwebtoken.verify(token, publicKey, { algorithms: ['RS256'] })
}

function getToken(authHeader) {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  return split[1]
}
